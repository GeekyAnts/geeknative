package app.features.catalog

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.cart.CartRepository
import app.features.cart.CartState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CategoryUiState(
    val categories: List<Category>,
    val selected: Category,
    val products: List<Product>,
    val cart: CartState = CartState(),
)

/** State and actions for the Category screen. An unknown [categoryId] shows the first category. */
class CategoryViewModel(
    private val catalog: CatalogRepository,
    private val cartRepository: CartRepository,
    categoryId: String,
) : ViewModel() {
    private val categories = catalog.categories()
    private val selectedId = MutableStateFlow(resolve(categoryId))

    private fun resolve(id: String): Category = categories.firstOrNull { it.id == id } ?: categories.first()

    private fun stateFor(category: Category, cart: CartState = CartState()) =
        CategoryUiState(categories, category, catalog.products(category.id), cart)

    val uiState: StateFlow<CategoryUiState> = combine(selectedId, cartRepository.lines) { category, lines ->
        stateFor(category, CartState.of(lines, catalog))
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), stateFor(selectedId.value))

    /** Switches the screen to another category, without pushing a new screen. */
    fun select(categoryId: String) {
        selectedId.value = resolve(categoryId)
    }

    fun add(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }

    fun remove(productId: String) {
        viewModelScope.launch { cartRepository.remove(productId) }
    }
}
