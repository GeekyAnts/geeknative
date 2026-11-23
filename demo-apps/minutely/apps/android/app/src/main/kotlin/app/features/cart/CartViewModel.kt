package app.features.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Product
import app.features.order.Order
import app.features.order.OrdersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** A cart line with its product, ready to show. */
data class CartItem(val product: Product, val quantity: Int) {
    val lineTotal: Int get() = product.price * quantity
    val lineMrp: Int get() = product.mrp * quantity
}

data class CartUiState(
    val items: List<CartItem> = emptyList(),
    val summary: CartSummary = CartSummary(),
    val isPlacingOrder: Boolean = false,
    /** False until the stored cart has loaded, so the empty state doesn't flash. */
    val isLoaded: Boolean = false,
) {
    val isEmpty: Boolean get() = items.isEmpty()
}

/**
 * State and actions for Cart. [clock] returns the current time in milliseconds; it stamps placed orders, so tests can fix it.
 */
class CartViewModel(
    private val catalog: CatalogRepository,
    private val cartRepository: CartRepository,
    private val ordersRepository: OrdersRepository,
    private val clock: () -> Long = System::currentTimeMillis,
) : ViewModel() {
    private val placing = MutableStateFlow(false)

    val uiState: StateFlow<CartUiState> = combine(cartRepository.lines, placing) { lines, isPlacing ->
        CartUiState(
            items = lines.mapNotNull { line -> catalog.product(line.productId)?.let { CartItem(it, line.quantity) } },
            summary = CartSummary.of(lines, catalog),
            isPlacingOrder = isPlacing,
            isLoaded = true,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), CartUiState())

    fun add(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }

    fun remove(productId: String) {
        viewModelScope.launch { cartRepository.remove(productId) }
    }

    /**
     * Saves an order built from the current cart, empties the cart, then calls [onPlaced] with the order's id.
     * Ignored while an order is already being placed, so a double tap places one order.
     */
    fun placeOrder(onPlaced: (orderId: String) -> Unit) {
        if (placing.value) return
        placing.value = true
        viewModelScope.launch {
            try {
                val lines = cartRepository.lines.first()
                if (lines.isEmpty()) return@launch
                val order = Order.place(lines, catalog, placedAt = clock())
                ordersRepository.save(order)
                cartRepository.clear()
                onPlaced(order.id)
            } finally {
                placing.value = false
            }
        }
    }
}
