package app.features.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.Chip
import app.core.designsystem.PrimaryButton
import app.core.designsystem.PushedScreen
import app.core.designsystem.ScreenHeader
import app.features.catalog.CuisineId
import app.features.catalog.Dietary
import app.features.catalog.Seating
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSpacing
import app.generated.AppTypography
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PreferencesViewModel(private val repository: PreferencesRepository) : ViewModel() {
    private val state = MutableStateFlow(DiningPreferences())
    val uiState: StateFlow<DiningPreferences> = state.asStateFlow()

    init {
        viewModelScope.launch { state.value = repository.load() }
    }

    fun toggleCuisine(id: CuisineId) = state.update {
        it.copy(cuisines = if (id in it.cuisines) it.cuisines - id else it.cuisines + id)
    }

    fun toggleDietary(id: Dietary) = state.update {
        it.copy(dietary = if (id in it.dietary) it.dietary - id else it.dietary + id)
    }

    fun setSeating(seating: Seating) = state.update { it.copy(seating = seating) }

    fun setPartySize(size: Int) = state.update {
        it.copy(partySize = size.coerceIn(DiningPreferences.MIN_PARTY_SIZE, DiningPreferences.MAX_PARTY_SIZE))
    }

    fun save() {
        viewModelScope.launch { repository.save(state.value) }
    }
}

@Composable
fun PreferencesScreen(viewModel: PreferencesViewModel, onBack: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val title = stringResource(R.string.preferences_title)
    PushedScreen(onBack = onBack, title = title) {
        item { ScreenHeader(title = title, subtitle = stringResource(R.string.preferences_subtitle)) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.preferences_cuisines), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(CuisineId.entries) { cuisine ->
                        Chip(stringResource(cuisine.label), cuisine in state.cuisines, { viewModel.toggleCuisine(cuisine) })
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.preferences_dietary), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(Dietary.entries) { item ->
                        Chip(stringResource(item.label), item in state.dietary, { viewModel.toggleDietary(item) })
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.preferences_seating), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(Seating.entries) { seating ->
                        Chip(stringResource(seating.label), seating == state.seating, { viewModel.setSeating(seating) }, icon = seating.icon)
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.preferences_party_size), style = AppTypography.subtitle)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    IconButton(onClick = { viewModel.setPartySize(state.partySize - 1) }) {
                        Icon(AppIcons.minus, contentDescription = stringResource(R.string.reserve_remove_guest))
                    }
                    Text(AppPlurals.reserveGuestCount(state.partySize), style = AppTypography.body)
                    IconButton(onClick = { viewModel.setPartySize(state.partySize + 1) }) {
                        Icon(AppIcons.plus, contentDescription = stringResource(R.string.reserve_add_guest))
                    }
                }
            }
        }
        item {
            PrimaryButton(
                text = stringResource(R.string.common_save),
                onClick = { viewModel.save(); onBack() },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
