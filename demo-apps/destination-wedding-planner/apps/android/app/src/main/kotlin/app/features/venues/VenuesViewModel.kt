package app.features.venues

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.Destination
import app.features.catalog.Venue
import app.features.catalog.VenueFilters
import app.features.catalog.WeddingCatalog
import app.features.catalog.filterVenues
import app.features.catalog.parsePositiveInt
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class VenuesUiState(
    val destinationId: String = "",
    val guests: String = "",
    val budget: String = "",
    val results: List<Venue> = emptyList(),
    val destinations: List<Destination> = WeddingCatalog.destinations,
)

class VenuesViewModel : ViewModel() {
    private val destinationId = MutableStateFlow("")
    private val guests = MutableStateFlow("")
    private val budget = MutableStateFlow("")

    val uiState: StateFlow<VenuesUiState> = combine(destinationId, guests, budget) { destination, guestsValue, budgetValue ->
        VenuesUiState(
            destinationId = destination,
            guests = guestsValue,
            budget = budgetValue,
            results = filterVenues(
                VenueFilters(
                    destinationId = destination,
                    guests = parsePositiveInt(guestsValue),
                    budget = parsePositiveInt(budgetValue),
                ),
            ),
        )
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        VenuesUiState(results = filterVenues(VenueFilters())),
    )

    fun setDestination(id: String) {
        destinationId.value = id
    }

    fun setGuests(value: String) {
        guests.value = value
    }

    fun setBudget(value: String) {
        budget.value = value
    }
}
