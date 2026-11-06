package app.features.destinations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.Destination
import app.features.catalog.Venue
import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPackage
import app.features.catalog.toggled
import app.features.wedding.WeddingRepository
import app.features.wedding.updatePlan
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class DestinationDetailUiState(
    val destination: Destination? = null,
    val venues: List<Venue> = emptyList(),
    val packages: List<WeddingPackage> = emptyList(),
    val saved: Boolean = false,
)

class DestinationDetailViewModel(
    private val destinationId: String,
    private val repository: WeddingRepository,
) : ViewModel() {
    val uiState: StateFlow<DestinationDetailUiState> = repository.plan
        .map { plan ->
            val destination = WeddingCatalog.destinationById(destinationId)
            DestinationDetailUiState(
                destination = destination,
                venues = destination?.let { WeddingCatalog.venuesForDestination(it.id) }.orEmpty(),
                packages = destination?.let { item -> WeddingCatalog.packages.filter { it.id in item.packageIds } }.orEmpty(),
                saved = destinationId in plan.savedDestinationIds,
            )
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DestinationDetailUiState(destination = WeddingCatalog.destinationById(destinationId)))

    fun toggleSaved() {
        viewModelScope.launch {
            repository.updatePlan { plan ->
                plan.copy(
                    savedDestinationIds = plan.savedDestinationIds.toggled(destinationId),
                    destinationId = destinationId,
                )
            }
        }
    }
}
