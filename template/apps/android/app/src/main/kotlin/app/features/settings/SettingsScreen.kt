package app.features.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.generated.AppIcons
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun SettingsScreen(viewModel: SettingsViewModel, onBack: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    SettingsContent(state = state, onSelectAppearance = viewModel::selectAppearance, onBack = onBack)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsContent(state: SettingsUiState, onSelectAppearance: (Appearance) -> Unit, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back))
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(AppSpacing.lg),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            AppCard {
                SectionTitle(stringResource(R.string.settings_appearance_title))
                Column(Modifier.selectableGroup().testTag("settings.appearance")) {
                    state.appearanceOptions.forEach { option ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = AppSize.touchTarget)
                                .selectable(
                                    selected = option == state.appearance,
                                    onClick = { onSelectAppearance(option) },
                                    role = Role.RadioButton,
                                ),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                        ) {
                            RadioButton(selected = option == state.appearance, onClick = null)
                            Text(stringResource(option.label), style = AppTypography.body)
                        }
                    }
                }
            }

            AppCard {
                SectionTitle(stringResource(R.string.settings_about_title))
                Text(
                    stringResource(R.string.settings_about_version, state.version, state.build),
                    style = AppTypography.body,
                    modifier = Modifier.testTag("settings.version"),
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
}

@Preview
@Composable
private fun SettingsScreenPreview() {
    AppTheme(darkTheme = false) {
        SettingsContent(state = SettingsUiState(), onSelectAppearance = {}, onBack = {})
    }
}
