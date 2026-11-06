package app.features.packages

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.BudgetBreakdown
import app.features.catalog.Experience
import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPackage
import app.features.catalog.budgetBreakdown
import app.features.catalog.parsePositiveInt
import app.features.catalog.toggled
import app.features.wedding.WeddingRepository
import app.features.wedding.updatePlan
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class PackagesUiState(
    val packages: List<WeddingPackage> = WeddingCatalog.packages,
    val experiences: List<Experience> = WeddingCatalog.experiences,
    val selectedId: String = "intimate",
    val guests: String = "80",
    val addons: List<String> = emptyList(),
    val breakdown: BudgetBreakdown = budgetBreakdown(WeddingCatalog.packages.first(), 80, emptyList()),
    val storedPackageId: String = "",
)

class PackagesViewModel(private val repository: WeddingRepository) : ViewModel() {
    private val selectedId = MutableStateFlow("intimate")
    private val guests = MutableStateFlow("80")
    private val addons = MutableStateFlow<List<String>>(emptyList())

    val uiState: StateFlow<PackagesUiState> = combine(selectedId, guests, addons, repository.plan) { id, guestsValue, addonIds, plan ->
        val guestCount = parsePositiveInt(guestsValue).coerceIn(2, 500).takeIf { parsePositiveInt(guestsValue) > 0 } ?: 80
        val selected = WeddingCatalog.packageById(id) ?: WeddingCatalog.packages.first()
        PackagesUiState(
            selectedId = selected.id,
            guests = guestsValue,
            addons = addonIds,
            breakdown = budgetBreakdown(selected, guestCount, addonIds),
            storedPackageId = plan.packageId,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), PackagesUiState())

    init {
        viewModelScope.launch {
            repository.plan.collect { plan ->
                if (plan.packageId.isNotEmpty() && selectedId.value == "intimate") selectedId.value = plan.packageId
                if (plan.guestCount > 0 && guests.value == "80") guests.value = plan.guestCount.toString()
                if (addons.value.isEmpty() && plan.selectedExperienceIds.isNotEmpty()) addons.value = plan.selectedExperienceIds
            }
        }
    }

    fun selectPackage(id: String) {
        selectedId.value = id
    }

    fun setGuests(value: String) {
        guests.value = value
    }

    fun toggleAddon(id: String) {
        addons.value = addons.value.toggled(id)
    }

    fun choosePackage() {
        viewModelScope.launch {
            val state = uiState.value
            val guestCount = parsePositiveInt(state.guests).coerceIn(2, 500)
            repository.updatePlan { plan ->
                plan.copy(
                    packageId = state.selectedId,
                    guestCount = guestCount,
                    selectedExperienceIds = state.addons,
                    budget = state.breakdown.total,
                )
            }
        }
    }
}
