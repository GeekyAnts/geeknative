package app.features.placedetails

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Place
import app.features.saved.SavedRepository
import app.features.tripplanner.Trip
import app.features.tripplanner.TripRepository
import app.features.tripplanner.appendPlaceToDayOne
import app.features.tripplanner.matchingTripsForPlace
import java.time.LocalDate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class PlaceDetailsUiState(
    val place: Place? = null,
    val destinationName: String = "",
    val currencySymbol: String = "",
    val saved: Boolean = false,
    val matchingTrips: List<Trip> = emptyList(),
    val fallbackImageUrl: String = "",
    val notFound: Boolean = false,
    val showTripSheet: Boolean = false,
    val addedMessage: Boolean = false,
)

class PlaceDetailsViewModel(
    private val placeId: String,
    private val catalog: CatalogRepository,
    private val savedRepository: SavedRepository,
    private val tripRepository: TripRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val sheet = MutableStateFlow(false)
    private val added = MutableStateFlow(false)

    val uiState: StateFlow<PlaceDetailsUiState> = combine(
        savedRepository.items,
        tripRepository.trips,
        sheet,
        added,
    ) { savedItems, trips, showSheet, addedMessage ->
        val place = catalog.place(placeId)
        if (place == null) {
            PlaceDetailsUiState(notFound = true)
        } else {
            val destination = catalog.destination(place.destinationId)
            PlaceDetailsUiState(
                place = place,
                destinationName = destination?.name.orEmpty(),
                currencySymbol = destination?.currencySymbol.orEmpty(),
                saved = savedItems.any { it.id == placeId },
                matchingTrips = matchingTripsForPlace(trips, place, today()),
                fallbackImageUrl = catalog.fallbackImageUrl(),
                showTripSheet = showSheet,
                addedMessage = addedMessage,
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), PlaceDetailsUiState())

    fun toggleSave() {
        val kind = catalog.place(placeId)?.kind ?: return
        viewModelScope.launch { savedRepository.toggle(placeId, kind) }
    }

    fun openTripSheet() {
        sheet.value = true
    }

    fun dismissTripSheet() {
        sheet.value = false
    }

    fun addToTrip(trip: Trip) {
        val place = catalog.place(placeId) ?: return
        viewModelScope.launch {
            tripRepository.upsert(appendPlaceToDayOne(trip, place))
            sheet.value = false
            added.value = true
        }
    }

    fun consumeAddedMessage() {
        added.value = false
    }
}
