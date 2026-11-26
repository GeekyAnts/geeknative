package app.features.saved

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.catalog.Place
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SavedDestinationItem(
    val destination: Destination,
)

data class SavedPlaceItem(
    val place: Place,
    val destinationName: String,
)

data class SavedUiState(
    val destinations: List<SavedDestinationItem> = emptyList(),
    val places: List<SavedPlaceItem> = emptyList(),
    val fallbackImageUrl: String = "",
    val empty: Boolean = true,
)

class SavedViewModel(
    private val savedRepository: SavedRepository,
    private val catalog: CatalogRepository,
) : ViewModel() {
    val uiState: StateFlow<SavedUiState> = savedRepository.items
        .map { items ->
            val destinations = items.mapNotNull { item ->
                if (item.kind == "destination") catalog.destination(item.id)?.let { SavedDestinationItem(it) } else null
            }
            val places = items.mapNotNull { item ->
                if (item.kind == "destination") {
                    null
                } else {
                    catalog.place(item.id)?.let { place ->
                        SavedPlaceItem(place, catalog.destination(place.destinationId)?.name.orEmpty())
                    }
                }
            }
            SavedUiState(
                destinations = destinations,
                places = places,
                fallbackImageUrl = catalog.fallbackImageUrl(),
                empty = destinations.isEmpty() && places.isEmpty(),
            )
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SavedUiState())

    fun unsave(id: String) {
        viewModelScope.launch { savedRepository.remove(id) }
    }
}
