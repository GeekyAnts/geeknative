package app.features.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.generated.AppIdentity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ProfileUiState(
    val displayName: String = "",
    val email: String = "",
    val defaultTravelers: Int = 2,
    val budgetBand: String = "mid",
    val preferredCategories: List<String> = emptyList(),
    val version: String = AppIdentity.VERSION,
    val build: Int = AppIdentity.BUILD,
)

class ProfileViewModel(private val repository: ProfileRepository) : ViewModel() {
    private val draftName = MutableStateFlow<String?>(null)
    private val draftEmail = MutableStateFlow<String?>(null)

    val uiState: StateFlow<ProfileUiState> = combine(
        repository.data,
        draftName,
        draftEmail,
    ) { profile, name, email ->
        ProfileUiState(
            displayName = name ?: profile.displayName,
            email = email ?: profile.email,
            defaultTravelers = profile.defaultTravelers,
            budgetBand = profile.budgetBand,
            preferredCategories = profile.preferredCategories,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ProfileUiState())

    fun onNameChange(value: String) {
        draftName.value = value
    }

    fun onEmailChange(value: String) {
        draftEmail.value = value
    }

    fun persistIdentity() {
        viewModelScope.launch {
            repository.update(snapshot())
            draftName.value = null
            draftEmail.value = null
        }
    }

    fun setTravelers(count: Int) {
        viewModelScope.launch {
            repository.update(stored().copy(defaultTravelers = count.coerceIn(1, 8)))
        }
    }

    fun setBudget(band: String) {
        viewModelScope.launch {
            repository.update(stored().copy(budgetBand = band))
        }
    }

    fun toggleCategory(id: String) {
        viewModelScope.launch {
            val profile = stored()
            val next = if (id in profile.preferredCategories) {
                profile.preferredCategories - id
            } else {
                profile.preferredCategories + id
            }
            repository.update(profile.copy(preferredCategories = next))
        }
    }

    private suspend fun stored(): ProfileData = repository.data.first()

    private fun snapshot(): ProfileData {
        val state = uiState.value
        return ProfileData(
            displayName = state.displayName,
            email = state.email,
            defaultTravelers = state.defaultTravelers,
            budgetBand = state.budgetBand,
            preferredCategories = state.preferredCategories,
        )
    }
}
