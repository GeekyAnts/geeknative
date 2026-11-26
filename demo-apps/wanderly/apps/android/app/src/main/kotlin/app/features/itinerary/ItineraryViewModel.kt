package app.features.itinerary

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.catalog.Place
import app.features.tripplanner.BudgetBreakdown
import app.features.tripplanner.Trip
import app.features.tripplanner.TripRepository
import app.features.tripplanner.addItemToDay
import app.features.tripplanner.moveItem
import app.features.tripplanner.saveTripStatus
import java.time.LocalDate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ItineraryUiState(
    val trip: Trip? = null,
    val destination: Destination? = null,
    val placesById: Map<String, Place> = emptyMap(),
    val budget: BudgetBreakdown? = null,
    val fallbackImageUrl: String = "",
    val addDayIndex: Int? = null,
    val addablePlaces: List<Place> = emptyList(),
)

class ItineraryViewModel(
    private val tripId: String,
    private val catalog: CatalogRepository,
    private val tripRepository: TripRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val addDay = MutableStateFlow<Int?>(null)

    val uiState: StateFlow<ItineraryUiState> = combine(
        tripRepository.trips.map { trips -> trips.firstOrNull { it.id == tripId } },
        addDay,
    ) { trip, addDayIndex ->
        val destination = trip?.let { catalog.destination(it.destinationId) }
        val places = catalog.places().associateBy { it.id }
        val addable = if (trip != null && addDayIndex != null) {
            val used = trip.days.firstOrNull { it.dayIndex == addDayIndex }?.items?.map { it.placeId }.orEmpty().toSet()
            catalog.places().filter { it.destinationId == trip.destinationId && it.id !in used }
        } else {
            emptyList()
        }
        ItineraryUiState(
            trip = trip,
            destination = destination,
            placesById = places,
            budget = trip?.let { tripRepository.budgetFor(it) },
            fallbackImageUrl = catalog.fallbackImageUrl(),
            addDayIndex = addDayIndex,
            addablePlaces = addable,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ItineraryUiState())

    fun openAdd(dayIndex: Int) {
        addDay.value = dayIndex
    }

    fun dismissAdd() {
        addDay.value = null
    }

    fun addPlace(place: Place) {
        val trip = currentTrip() ?: return
        val dayIndex = addDay.value ?: return
        val days = trip.days.map { day ->
            if (day.dayIndex == dayIndex) addItemToDay(day, place) else day
        }
        persist(trip.copy(days = days))
        addDay.value = null
    }

    fun remove(itemId: String) {
        val trip = currentTrip() ?: return
        persist(
            trip.copy(
                days = trip.days.map { day ->
                    day.copy(items = day.items.filterNot { it.id == itemId })
                },
            ),
        )
    }

    fun move(itemId: String, delta: Int) {
        val trip = currentTrip() ?: return
        persist(
            trip.copy(
                days = trip.days.map { day ->
                    if (day.items.any { it.id == itemId }) moveItem(day, itemId, delta) else day
                },
            ),
        )
    }

    fun toggleComplete(itemId: String) {
        val trip = currentTrip() ?: return
        persist(
            trip.copy(
                days = trip.days.map { day ->
                    day.copy(
                        items = day.items.map { item ->
                            if (item.id == itemId) item.copy(completed = !item.completed) else item
                        },
                    )
                },
            ),
        )
    }

    fun saveTrip() {
        val trip = currentTrip() ?: return
        persist(trip.copy(status = saveTripStatus(trip.endDate, today())))
    }

    private fun currentTrip(): Trip? = uiState.value.trip

    private fun persist(trip: Trip) {
        viewModelScope.launch { tripRepository.upsert(trip) }
    }
}
