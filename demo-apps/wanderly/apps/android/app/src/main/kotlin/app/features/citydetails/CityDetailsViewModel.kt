package app.features.citydetails

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.catalog.Place
import app.features.saved.SavedRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CityDetailsUiState(
    val destination: Destination? = null,
    val attractions: List<Place> = emptyList(),
    val hotels: List<Place> = emptyList(),
    val restaurants: List<Place> = emptyList(),
    val activities: List<Place> = emptyList(),
    val saved: Boolean = false,
    val fallbackImageUrl: String = "",
    val notFound: Boolean = false,
)

class CityDetailsViewModel(
    private val destinationId: String,
    private val catalog: CatalogRepository,
    private val savedRepository: SavedRepository,
) : ViewModel() {
    val uiState: StateFlow<CityDetailsUiState> = combine(
        savedRepository.items,
        flowOf(destinationId),
    ) { savedItems, id ->
        val destination = catalog.destination(id)
        if (destination == null) {
            CityDetailsUiState(notFound = true)
        } else {
            CityDetailsUiState(
                destination = destination,
                attractions = catalog.placesFor(id, "attraction"),
                hotels = catalog.placesFor(id, "hotel"),
                restaurants = catalog.placesFor(id, "restaurant"),
                activities = catalog.placesFor(id, "activity"),
                saved = savedItems.any { it.id == id },
                fallbackImageUrl = catalog.fallbackImageUrl(),
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), CityDetailsUiState())

    fun toggleSave() {
        viewModelScope.launch { savedRepository.toggle(destinationId, "destination") }
    }
}
