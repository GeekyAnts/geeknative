package app.features.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.BudgetBandRow
import app.core.designsystem.CategoryChipRow
import app.core.designsystem.InitialsAvatar
import app.core.designsystem.TravelersStepper
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onOpenSettings: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ProfileContent(
        state = state,
        onNameChange = viewModel::onNameChange,
        onEmailChange = viewModel::onEmailChange,
        onPersistIdentity = viewModel::persistIdentity,
        onTravelers = viewModel::setTravelers,
        onBudget = viewModel::setBudget,
        onInterest = viewModel::toggleCategory,
        onOpenSettings = onOpenSettings,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileContent(
    state: ProfileUiState,
    onNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPersistIdentity: () -> Unit,
    onTravelers: (Int) -> Unit,
    onBudget: (String) -> Unit,
    onInterest: (String) -> Unit,
    onOpenSettings: () -> Unit,
) {
    val displayedName = state.displayName.ifBlank { stringResource(R.string.profile_default_name) }
    var nameHadFocus by remember { mutableStateOf(false) }
    var emailHadFocus by remember { mutableStateOf(false) }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.profile_title), modifier = Modifier.testTag("profile.title")) },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(AppSpacing.lg),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            InitialsAvatar(displayedName)
            OutlinedTextField(
                value = state.displayName,
                onValueChange = onNameChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("profile.name")
                    .onFocusChanged {
                        if (it.isFocused) nameHadFocus = true
                        else if (nameHadFocus) onPersistIdentity()
                    },
                label = { Text(stringResource(R.string.profile_name)) },
                placeholder = { Text(stringResource(R.string.profile_name_placeholder)) },
                singleLine = true,
            )
            OutlinedTextField(
                value = state.email,
                onValueChange = onEmailChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("profile.email")
                    .onFocusChanged {
                        if (it.isFocused) emailHadFocus = true
                        else if (emailHadFocus) onPersistIdentity()
                    },
                label = { Text(stringResource(R.string.profile_email)) },
                placeholder = { Text(stringResource(R.string.profile_email_placeholder)) },
                singleLine = true,
            )

            AppCard {
                Text(stringResource(R.string.profile_preferences), style = AppTypography.title)
                TravelersStepper(
                    count = state.defaultTravelers,
                    onChange = onTravelers,
                    testTag = "profile.travelers",
                    label = R.string.profile_default_travelers,
                )
                Text(stringResource(R.string.profile_default_budget), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                BudgetBandRow(
                    selected = state.budgetBand,
                    onSelect = onBudget,
                    testTagPrefix = "profile.budget",
                )
                Text(stringResource(R.string.profile_interests), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                CategoryChipRow(
                    selectedIds = state.preferredCategories.toSet(),
                    onSelect = { onInterest(it.id) },
                    testTagPrefix = "profile.interest",
                    padded = false,
                )
            }

            TextButton(onClick = onOpenSettings, modifier = Modifier.fillMaxWidth().testTag("profile.openSettings")) {
                Text(stringResource(R.string.profile_open_settings))
            }

            Text(
                stringResource(R.string.settings_about_version, state.version, state.build),
                style = AppTypography.caption,
                color = AppTheme.colors.onSurfaceVariant,
                modifier = Modifier.testTag("profile.version"),
            )
        }
    }
}

@Preview
@Composable
private fun ProfileScreenPreview() {
    AppTheme(darkTheme = false) {
        ProfileContent(
            state = ProfileUiState(),
            onNameChange = {},
            onEmailChange = {},
            onPersistIdentity = {},
            onTravelers = {},
            onBudget = {},
            onInterest = {},
            onOpenSettings = {},
        )
    }
}
