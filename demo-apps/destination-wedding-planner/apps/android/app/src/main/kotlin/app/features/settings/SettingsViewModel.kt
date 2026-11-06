package app.features.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.generated.AppIdentity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SettingsUiState(
    val appearance: Appearance = Appearance.System,
    val appearanceOptions: List<Appearance> = Appearance.entries,
    val version: String = AppIdentity.VERSION,
    val build: Int = AppIdentity.BUILD,
)

/** State and actions for the Settings screen. */
class SettingsViewModel(private val repository: SettingsRepository) : ViewModel() {
    val uiState: StateFlow<SettingsUiState> = repository.appearance
        .map { SettingsUiState(appearance = it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SettingsUiState())

    fun selectAppearance(appearance: Appearance) {
        viewModelScope.launch { repository.setAppearance(appearance) }
    }
}
