package app.features.venues

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.BookingStatus
import app.features.catalog.Destination
import app.features.catalog.Enquiry
import app.features.catalog.EnquiryDraft
import app.features.catalog.Venue
import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPackage
import app.features.catalog.parsePositiveInt
import app.features.catalog.toggled
import app.features.wedding.WeddingRepository
import app.features.wedding.updatePlan
import java.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class VenueDetailUiState(
    val venue: Venue? = null,
    val destination: Destination? = null,
    val packages: List<WeddingPackage> = emptyList(),
    val saved: Boolean = false,
    val enquireOpen: Boolean = false,
    val enquireSuccess: Boolean = false,
)

class VenueDetailViewModel(
    private val venueId: String,
    private val repository: WeddingRepository,
) : ViewModel() {
    private val enquireOpen = MutableStateFlow(false)
    private val enquireSuccess = MutableStateFlow(false)

    val uiState: StateFlow<VenueDetailUiState> = combine(repository.plan, enquireOpen, enquireSuccess) { plan, open, success ->
        val venue = WeddingCatalog.venueById(venueId)
        VenueDetailUiState(
            venue = venue,
            destination = venue?.let { WeddingCatalog.destinationById(it.destinationId) },
            packages = venue?.let { item -> WeddingCatalog.packages.filter { it.id in item.packageIds } }.orEmpty(),
            saved = venueId in plan.savedVenueIds,
            enquireOpen = open,
            enquireSuccess = success,
        )
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        VenueDetailUiState(venue = WeddingCatalog.venueById(venueId)),
    )

    fun toggleSaved() {
        viewModelScope.launch {
            val venue = WeddingCatalog.venueById(venueId) ?: return@launch
            repository.updatePlan { plan ->
                plan.copy(
                    savedVenueIds = plan.savedVenueIds.toggled(venueId),
                    venueId = venueId,
                    destinationId = venue.destinationId,
                )
            }
        }
    }

    fun openEnquiry() {
        enquireSuccess.value = false
        enquireOpen.value = true
    }

    fun closeEnquiry() {
        enquireOpen.value = false
    }

    fun submitEnquiry(draft: EnquiryDraft) {
        val venue = WeddingCatalog.venueById(venueId) ?: return
        enquireSuccess.value = true
        enquireOpen.value = false
        viewModelScope.launch {
            repository.addEnquiry(
                Enquiry(
                    id = Instant.now().toEpochMilli().toString(),
                    venueId = venue.id,
                    experienceId = "",
                    coupleName = draft.coupleName.trim(),
                    email = draft.email.trim(),
                    date = draft.date,
                    guests = parsePositiveInt(draft.guests),
                    message = draft.message.trim(),
                    createdAt = Instant.now().toString(),
                ),
            )
            repository.updatePlan { plan ->
                plan.copy(
                    venueId = venue.id,
                    destinationId = venue.destinationId,
                    bookingStatus = BookingStatus.EnquirySent.id,
                    date = draft.date.ifBlank { plan.date },
                    guestCount = parsePositiveInt(draft.guests).takeIf { it > 0 } ?: plan.guestCount,
                )
            }
            enquireSuccess.value = true
        }
    }
}
