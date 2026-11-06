package app.features.wedding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.Destination
import app.features.catalog.TaskId
import app.features.catalog.Venue
import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPlan
import app.features.catalog.daysRemaining
import app.features.catalog.parsePositiveInt
import app.features.catalog.toggled
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class WeddingUiState(
    val plan: WeddingPlan = WeddingPlan.Empty,
    val destination: Destination? = null,
    val venue: Venue? = null,
    val daysRemaining: Int = 0,
    val savedDestinations: List<Destination> = emptyList(),
    val savedVenues: List<Venue> = emptyList(),
    val guests: String = "80",
    val budget: String = "",
)

class WeddingViewModel(private val repository: WeddingRepository) : ViewModel() {
    val uiState: StateFlow<WeddingUiState> = repository.plan
        .map { plan ->
            WeddingUiState(
                plan = plan,
                destination = plan.destinationId.takeIf { it.isNotEmpty() }?.let(WeddingCatalog::destinationById),
                venue = plan.venueId.takeIf { it.isNotEmpty() }?.let(WeddingCatalog::venueById),
                daysRemaining = daysRemaining(plan.date),
                savedDestinations = plan.savedDestinationIds.mapNotNull(WeddingCatalog::destinationById),
                savedVenues = plan.savedVenueIds.mapNotNull(WeddingCatalog::venueById),
                guests = plan.guestCount.toString(),
                budget = plan.budget.takeIf { it > 0 }?.toString().orEmpty(),
            )
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), WeddingUiState())

    fun setDate(value: String) {
        viewModelScope.launch { repository.updatePlan { it.copy(date = value) } }
    }

    fun setGuests(value: String) {
        val guests = parsePositiveInt(value)
        if (guests == 0 && value.isNotBlank()) return
        viewModelScope.launch {
            repository.updatePlan { plan -> plan.copy(guestCount = guests.takeIf { it > 0 } ?: plan.guestCount) }
        }
    }

    fun setBudget(value: String) {
        viewModelScope.launch { repository.updatePlan { it.copy(budget = parsePositiveInt(value)) } }
    }

    fun toggleTask(id: String) {
        viewModelScope.launch { repository.updatePlan { it.copy(completedTaskIds = it.completedTaskIds.toggled(id)) } }
    }

    val tasks = TaskId.all
}
