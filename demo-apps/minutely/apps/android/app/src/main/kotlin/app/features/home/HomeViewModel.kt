package app.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.cart.CartRepository
import app.features.cart.CartState
import app.features.catalog.CatalogRepository
import app.features.catalog.Category
import app.features.catalog.Product
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class HomeUiState(
    val categories: List<Category> = emptyList(),
    val bestsellers: List<Product> = emptyList(),
    val cart: CartState = CartState(),
)

/** State and actions for Home. */
class HomeViewModel(catalog: CatalogRepository, private val cartRepository: CartRepository) : ViewModel() {
    private val initial = HomeUiState(categories = catalog.categories(), bestsellers = catalog.bestsellers())

    val uiState: StateFlow<HomeUiState> = cartRepository.lines
        .map { initial.copy(cart = CartState.of(it, catalog)) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initial)

    fun add(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }

    fun remove(productId: String) {
        viewModelScope.launch { cartRepository.remove(productId) }
    }
}
