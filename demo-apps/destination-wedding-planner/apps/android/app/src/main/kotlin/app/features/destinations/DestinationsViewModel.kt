package app.features.destinations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.Destination
import app.features.catalog.DestinationFilters
import app.features.catalog.WeddingStyle
import app.features.catalog.filterDestinations
import app.features.catalog.parsePositiveInt
import app.features.catalog.seasonalDestinations
import app.features.wedding.WeddingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class DestinationsUiState(
    val location: String = "",
    val style: String = "",
    val guests: String = "",
    val budget: String = "",
    val results: List<Destination> = emptyList(),
    val seasonal: List<Destination> = emptyList(),
)

class DestinationsViewModel(repository: WeddingRepository) : ViewModel() {
    private val location = MutableStateFlow("")
    private val style = MutableStateFlow("")
    private val guests = MutableStateFlow("")
    private val budget = MutableStateFlow("")

    val uiState: StateFlow<DestinationsUiState> = combine(location, style, guests, budget) { locationValue, styleValue, guestsValue, budgetValue ->
        val filters = DestinationFilters(
            location = locationValue,
            style = styleValue,
            guests = parsePositiveInt(guestsValue),
            budget = parsePositiveInt(budgetValue),
        )
        DestinationsUiState(
            location = locationValue,
            style = styleValue,
            guests = guestsValue,
            budget = budgetValue,
            results = filterDestinations(filters),
            seasonal = seasonalDestinations(),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DestinationsUiState(results = filterDestinations(DestinationFilters()), seasonal = seasonalDestinations()))

    init {
        viewModelScope.launch {
            repository.plan.collect { plan ->
                if (location.value.isEmpty() && plan.searchLocation.isNotEmpty()) location.value = plan.searchLocation
                if (guests.value.isEmpty() && plan.searchGuests > 0) guests.value = plan.searchGuests.toString()
                if (budget.value.isEmpty() && plan.searchBudget > 0) budget.value = plan.searchBudget.toString()
            }
        }
    }

    fun setLocation(value: String) {
        location.value = value
    }

    fun setStyle(value: String) {
        style.value = if (style.value == value) "" else value
    }

    fun clearStyle() {
        style.value = ""
    }

    fun setGuests(value: String) {
        guests.value = value
    }

    fun setBudget(value: String) {
        budget.value = value
    }

    val styles: List<WeddingStyle> = WeddingStyle.all
}
