package app.features.tripplanner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.profile.ProfileRepository
import java.time.LocalDate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TripPlannerUiState(
    val destinations: List<Destination> = emptyList(),
    val destinationId: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val travelers: Int = 2,
    val budgetBand: String = "mid",
    val interests: List<String> = emptyList(),
    val destinationError: Boolean = false,
    val dateError: Boolean = false,
    val rangeError: Boolean = false,
    val generatedTripId: String? = null,
)

class TripPlannerViewModel(
    private val catalog: CatalogRepository,
    private val tripRepository: TripRepository,
    private val profileRepository: ProfileRepository,
    initialDestinationId: String? = null,
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        TripPlannerUiState(
            destinations = catalog.destinations(),
            destinationId = initialDestinationId,
        ),
    )
    val uiState: StateFlow<TripPlannerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val profile = profileRepository.data.first()
            _uiState.update { current ->
                current.copy(
                    travelers = profile.defaultTravelers.coerceIn(1, 8),
                    budgetBand = profile.budgetBand,
                    interests = profile.preferredCategories,
                    destinationId = current.destinationId ?: initialDestinationId,
                )
            }
        }
    }

    fun selectDestination(id: String) {
        _uiState.update { it.copy(destinationId = id, destinationError = false) }
    }

    fun selectStart(date: LocalDate) {
        _uiState.update { it.copy(startDate = date, dateError = false, rangeError = false) }
    }

    fun selectEnd(date: LocalDate) {
        _uiState.update { it.copy(endDate = date, dateError = false, rangeError = false) }
    }

    fun setTravelers(count: Int) {
        _uiState.update { it.copy(travelers = count.coerceIn(1, 8)) }
    }

    fun setBudget(band: String) {
        _uiState.update { it.copy(budgetBand = band) }
    }

    fun toggleInterest(id: String) {
        _uiState.update { current ->
            val next = if (id in current.interests) current.interests - id else current.interests + id
            current.copy(interests = next)
        }
    }

    fun generate() {
        val state = _uiState.value
        val result = tripRepository.generate(
            GenerateRequest(
                destinationId = state.destinationId,
                startDate = state.startDate,
                endDate = state.endDate,
                travelers = state.travelers,
                budgetBand = state.budgetBand,
                interests = state.interests,
            ),
        )
        when (result) {
            is GenerateResult.Success -> viewModelScope.launch {
                tripRepository.upsert(result.trip)
                _uiState.update {
                    it.copy(
                        generatedTripId = result.trip.id,
                        destinationError = false,
                        dateError = false,
                        rangeError = false,
                    )
                }
            }
            GenerateResult.MissingDestination -> _uiState.update {
                it.copy(destinationError = true, dateError = false, rangeError = false)
            }
            GenerateResult.MissingDates, GenerateResult.InvalidDateRange -> _uiState.update {
                it.copy(dateError = true, destinationError = false, rangeError = false)
            }
            GenerateResult.RangeTooLong -> _uiState.update {
                it.copy(rangeError = true, destinationError = false, dateError = false)
            }
        }
    }

    fun consumeGenerated() {
        _uiState.update { it.copy(generatedTripId = null) }
    }
}
