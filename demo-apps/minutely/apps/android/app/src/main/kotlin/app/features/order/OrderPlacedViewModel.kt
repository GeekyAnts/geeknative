package app.features.order

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface OrderPlacedUiState {
    /** Reading the stored order; shows nothing rather than flashing not-found. */
    data object Loading : OrderPlacedUiState

    data class Found(val order: Order) : OrderPlacedUiState

    data object NotFound : OrderPlacedUiState
}

/** State for Order placed, for one order id. */
class OrderPlacedViewModel(ordersRepository: OrdersRepository, orderId: String) : ViewModel() {
    private val state = MutableStateFlow<OrderPlacedUiState>(OrderPlacedUiState.Loading)
    val uiState: StateFlow<OrderPlacedUiState> = state.asStateFlow()

    init {
        viewModelScope.launch {
            state.value = ordersRepository.order(orderId)?.let { OrderPlacedUiState.Found(it) } ?: OrderPlacedUiState.NotFound
        }
    }
}
