package app.features.experiences

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.Enquiry
import app.features.catalog.EnquiryDraft
import app.features.catalog.Experience
import app.features.catalog.WeddingCatalog
import app.features.catalog.parsePositiveInt
import app.features.wedding.WeddingRepository
import app.features.wedding.currentPlan
import app.features.wedding.updatePlan
import java.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ExperiencesUiState(
    val experiences: List<Experience> = WeddingCatalog.experiences,
    val activeId: String? = null,
    val enquireSuccess: Boolean = false,
)

class ExperiencesViewModel(private val repository: WeddingRepository) : ViewModel() {
    private val state = MutableStateFlow(ExperiencesUiState())
    val uiState: StateFlow<ExperiencesUiState> = state.asStateFlow()

    fun openEnquiry(id: String) {
        state.update { it.copy(activeId = id, enquireSuccess = false) }
    }

    fun closeEnquiry() {
        state.update { it.copy(activeId = null) }
    }

    fun submitEnquiry(draft: EnquiryDraft) {
        val experienceId = state.value.activeId ?: return
        viewModelScope.launch {
            repository.addEnquiry(
                Enquiry(
                    id = Instant.now().toEpochMilli().toString(),
                    venueId = "",
                    experienceId = experienceId,
                    coupleName = draft.coupleName.trim(),
                    email = draft.email.trim(),
                    date = draft.date,
                    guests = parsePositiveInt(draft.guests),
                    message = draft.message.trim(),
                    createdAt = Instant.now().toString(),
                ),
            )
            val plan = repository.currentPlan()
            val ids = if (experienceId in plan.selectedExperienceIds) plan.selectedExperienceIds else plan.selectedExperienceIds + experienceId
            repository.updatePlan { it.copy(selectedExperienceIds = ids) }
            state.update { it.copy(enquireSuccess = true) }
        }
    }
}
