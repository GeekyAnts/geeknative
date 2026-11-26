package app.features.mytrips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.tripplanner.Trip
import app.features.tripplanner.TripRepository
import app.features.tripplanner.TripSegment
import app.features.tripplanner.classifyTrip
import app.features.tripplanner.rewriteStatusOnRead
import java.time.LocalDate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class MyTripsUiState(
    val segment: TripSegment = TripSegment.Upcoming,
    val trips: List<Trip> = emptyList(),
    val destinations: Map<String, Destination> = emptyMap(),
    val fallbackImageUrl: String = "",
    val pendingDeleteId: String? = null,
)

class MyTripsViewModel(
    private val tripRepository: TripRepository,
    private val catalog: CatalogRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val segment = MutableStateFlow(TripSegment.Upcoming)
    private val pendingDelete = MutableStateFlow<String?>(null)

    val uiState: StateFlow<MyTripsUiState> = combine(
        tripRepository.trips,
        segment,
        pendingDelete,
    ) { trips, selected, deleteId ->
        val classified = trips.map { rewriteStatusOnRead(it, today()) }
        MyTripsUiState(
            segment = selected,
            trips = classified.filter { classifyTrip(it, today()) == selected },
            destinations = catalog.destinations().associateBy { it.id },
            fallbackImageUrl = catalog.fallbackImageUrl(),
            pendingDeleteId = deleteId,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), MyTripsUiState())

    fun select(segment: TripSegment) {
        this.segment.value = segment
    }

    fun requestDelete(id: String) {
        pendingDelete.value = id
    }

    fun cancelDelete() {
        pendingDelete.value = null
    }

    fun confirmDelete() {
        val id = pendingDelete.value ?: return
        viewModelScope.launch {
            tripRepository.delete(id)
            pendingDelete.value = null
        }
    }
}
