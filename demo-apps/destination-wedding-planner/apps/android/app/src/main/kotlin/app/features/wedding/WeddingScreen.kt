package app.features.wedding

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppDateField
import app.core.designsystem.AppTextField
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.GlassPanel
import app.features.catalog.TaskId
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun WeddingScreen(
    viewModel: WeddingViewModel,
    onOpenDestinations: () -> Unit,
    onOpenVenues: () -> Unit,
    onOpenPackages: () -> Unit,
    onOpenDestination: (String) -> Unit,
    onOpenVenue: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    WeddingContent(
        state = state,
        tasks = viewModel.tasks,
        onDateChange = viewModel::setDate,
        onGuestsChange = viewModel::setGuests,
        onBudgetChange = viewModel::setBudget,
        onToggleTask = viewModel::toggleTask,
        onOpenDestinations = onOpenDestinations,
        onOpenVenues = onOpenVenues,
        onOpenPackages = onOpenPackages,
        onOpenDestination = onOpenDestination,
        onOpenVenue = onOpenVenue,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WeddingContent(
    state: WeddingUiState,
    tasks: List<TaskId>,
    onDateChange: (String) -> Unit,
    onGuestsChange: (String) -> Unit,
    onBudgetChange: (String) -> Unit,
    onToggleTask: (String) -> Unit,
    onOpenDestinations: () -> Unit,
    onOpenVenues: () -> Unit,
    onOpenPackages: () -> Unit,
    onOpenDestination: (String) -> Unit,
    onOpenVenue: (String) -> Unit,
) {
    Scaffold(
        containerColor = AppTheme.colors.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.wedding_title)) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = AppTheme.colors.background,
                    titleContentColor = AppTheme.colors.onBackground,
                ),
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
        ) {
            Text(stringResource(R.string.wedding_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
            GlassPanel {
                if (state.plan.date.isNotBlank()) {
                    Text(
                        if (state.daysRemaining == 0) {
                            stringResource(R.string.wedding_countdown_today)
                        } else {
                            stringResource(R.string.wedding_countdown, state.daysRemaining)
                        },
                        style = AppTypography.hero,
                        modifier = Modifier.testTag("wedding.countdown"),
                    )
                } else {
                    Text(stringResource(R.string.wedding_no_date_title), style = AppTypography.headline)
                    Text(stringResource(R.string.wedding_no_date_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                }
                AppDateField(
                    value = state.plan.date,
                    onValueChange = onDateChange,
                    label = stringResource(R.string.wedding_date),
                    modifier = Modifier.testTag("wedding.date"),
                )
            }
            GlassPanel {
                Text(stringResource(R.string.wedding_destination), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                Text(
                    state.destination?.name ?: stringResource(R.string.wedding_no_destination),
                    style = AppTypography.title,
                    modifier = Modifier.testTag("wedding.destination"),
                )
                state.destination?.let { destination ->
                    CatalogPhoto(
                        url = destination.imageUrl,
                        contentDescription = destination.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(AppSpacing.xxxl * 3)
                            .clickable { onOpenDestination(destination.id) },
                    )
                } ?: Text(
                    stringResource(R.string.nav_destinations),
                    style = AppTypography.label,
                    color = AppTheme.colors.primary,
                    modifier = Modifier.clickable(onClick = onOpenDestinations),
                )
            }
            GlassPanel {
                Text(stringResource(R.string.wedding_venue), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                Text(
                    state.venue?.name ?: stringResource(R.string.wedding_no_venue),
                    style = AppTypography.title,
                    modifier = Modifier.testTag("wedding.venue"),
                )
                state.venue?.let { venue ->
                    CatalogPhoto(
                        url = venue.imageUrl,
                        contentDescription = venue.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(AppSpacing.xxxl * 3)
                            .clickable { onOpenVenue(venue.id) },
                    )
                } ?: Text(
                    stringResource(R.string.nav_venues),
                    style = AppTypography.label,
                    color = AppTheme.colors.primary,
                    modifier = Modifier.clickable(onClick = onOpenVenues),
                )
            }
            AppTextField(
                value = state.guests,
                onValueChange = onGuestsChange,
                label = stringResource(R.string.wedding_guests),
                modifier = Modifier.testTag("wedding.guests"),
                keyboardType = KeyboardType.Number,
            )
            AppTextField(
                value = state.budget,
                onValueChange = onBudgetChange,
                label = stringResource(R.string.wedding_budget),
                modifier = Modifier.testTag("wedding.budget"),
                keyboardType = KeyboardType.Number,
            )
            Column {
                Text(stringResource(R.string.wedding_status_label), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                Text(
                    stringResource(state.plan.status.label),
                    style = AppTypography.title,
                    modifier = Modifier.testTag("wedding.status"),
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.wedding_timeline), style = AppTypography.headline)
                Text(
                    stringResource(R.string.wedding_progress, state.plan.completedTaskIds.size, tasks.size),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                    modifier = Modifier.testTag("wedding.progress"),
                )
                tasks.forEach { task ->
                    val done = task.id in state.plan.completedTaskIds
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = AppSize.touchTarget)
                            .testTag("wedding.task.${task.id}")
                            .toggleable(value = done, onValueChange = { onToggleTask(task.id) }, role = Role.Checkbox),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    ) {
                        Checkbox(checked = done, onCheckedChange = null)
                        Text(stringResource(task.label), style = AppTypography.body)
                    }
                }
            }
            Column(
                modifier = Modifier.testTag("wedding.saved"),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(stringResource(R.string.wedding_saved), style = AppTypography.headline)
                if (state.savedDestinations.isEmpty() && state.savedVenues.isEmpty()) {
                    Text(stringResource(R.string.wedding_saved_empty), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                } else {
                    state.savedDestinations.forEach { destination -> SavedPlace(destination.name, destination.imageUrl) { onOpenDestination(destination.id) } }
                    state.savedVenues.forEach { venue -> SavedPlace(venue.name, venue.imageUrl) { onOpenVenue(venue.id) } }
                }
            }
            Button(
                onClick = onOpenPackages,
                modifier = Modifier
                    .testTag("wedding.packagesCta")
                    .fillMaxWidth(),
            ) {
                Text(stringResource(R.string.wedding_packages_cta))
            }
        }
    }
}

@Composable
private fun SavedPlace(name: String, imageUrl: String, onClick: () -> Unit) {
    AppCard(modifier = Modifier.clickable(onClick = onClick)) {
        CatalogPhoto(
            url = imageUrl,
            contentDescription = name,
            modifier = Modifier
                .fillMaxWidth()
                .height(AppSpacing.xxxl * 3),
        )
        Text(name, style = AppTypography.title)
    }
}
