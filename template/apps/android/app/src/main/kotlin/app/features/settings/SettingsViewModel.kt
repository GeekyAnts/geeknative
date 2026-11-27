package app.features.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.notifications.NotificationsRepository
import app.generated.AppIdentity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SettingsUiState(
    val appearance: Appearance = Appearance.System,
    val appearanceOptions: List<Appearance> = Appearance.entries,
    val notificationsEnabled: Boolean = false,
    val version: String = AppIdentity.VERSION,
    val build: Int = AppIdentity.BUILD,
)

/** State and actions for the Settings screen. */
class SettingsViewModel(
    private val repository: SettingsRepository,
    private val notificationsRepository: NotificationsRepository,
) : ViewModel() {
    val uiState: StateFlow<SettingsUiState> = combine(
        repository.appearance,
        notificationsRepository.enabled,
    ) { appearance, notificationsEnabled ->
        SettingsUiState(appearance = appearance, notificationsEnabled = notificationsEnabled)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SettingsUiState())

    fun selectAppearance(appearance: Appearance) {
        viewModelScope.launch { repository.setAppearance(appearance) }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch { notificationsRepository.setEnabled(enabled) }
    }
}
