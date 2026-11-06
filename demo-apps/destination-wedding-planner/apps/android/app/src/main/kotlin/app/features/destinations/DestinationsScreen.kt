package app.features.destinations

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTextField
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.features.catalog.Destination
import app.features.catalog.formatAmount
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun DestinationsScreen(
    viewModel: DestinationsViewModel,
    onOpenDestination: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    DestinationsContent(
        state = state,
        styles = viewModel.styles,
        onLocationChange = viewModel::setLocation,
        onStyleClick = viewModel::setStyle,
        onClearStyle = viewModel::clearStyle,
        onGuestsChange = viewModel::setGuests,
        onBudgetChange = viewModel::setBudget,
        onOpenDestination = onOpenDestination,
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun DestinationsContent(
    state: DestinationsUiState,
    styles: List<app.features.catalog.WeddingStyle>,
    onLocationChange: (String) -> Unit,
    onStyleClick: (String) -> Unit,
    onClearStyle: () -> Unit,
    onGuestsChange: (String) -> Unit,
    onBudgetChange: (String) -> Unit,
    onOpenDestination: (String) -> Unit,
) {
    Scaffold(
        containerColor = AppTheme.colors.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.destinations_title)) },
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
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            Text(stringResource(R.string.destinations_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)

            Column(
                modifier = Modifier.testTag("destinations.filter.style"),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(stringResource(R.string.destinations_filter_title), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    FilterChip(
                        selected = state.style.isEmpty(),
                        onClick = onClearStyle,
                        label = { Text(stringResource(R.string.style_all)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = AppTheme.colors.primary,
                            selectedLabelColor = AppTheme.colors.onPrimary,
                        ),
                    )
                    styles.forEach { style ->
                        FilterChip(
                            selected = state.style == style.id,
                            onClick = { onStyleClick(style.id) },
                            label = { Text(stringResource(style.label)) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = AppTheme.colors.primary,
                                selectedLabelColor = AppTheme.colors.onPrimary,
                            ),
                        )
                    }
                }
                AppTextField(
                    value = state.location,
                    onValueChange = onLocationChange,
                    label = stringResource(R.string.destinations_filter_location),
                )
                AppTextField(
                    value = state.guests,
                    onValueChange = onGuestsChange,
                    label = stringResource(R.string.destinations_filter_guests),
                    modifier = Modifier.testTag("destinations.filter.guests"),
                    keyboardType = KeyboardType.Number,
                )
                AppTextField(
                    value = state.budget,
                    onValueChange = onBudgetChange,
                    label = stringResource(R.string.destinations_filter_budget),
                    modifier = Modifier.testTag("destinations.filter.budget"),
                    keyboardType = KeyboardType.Number,
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                Text(stringResource(R.string.destinations_seasonal_title), style = AppTypography.headline)
                state.seasonal.forEach { destination ->
                    DestinationSummaryCard(destination = destination, onClick = { onOpenDestination(destination.id) })
                }
            }

            if (state.results.isEmpty()) {
                AppCard(modifier = Modifier.testTag("destinations.empty")) {
                    Text(stringResource(R.string.destinations_empty_title), style = AppTypography.title)
                    Text(stringResource(R.string.destinations_empty_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                }
            } else {
                Column(
                    modifier = Modifier.testTag("destinations.list"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
                ) {
                    state.results.forEach { destination ->
                        DestinationResultCard(destination = destination, onClick = { onOpenDestination(destination.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun DestinationSummaryCard(destination: Destination, onClick: () -> Unit) {
    AppCard(modifier = Modifier.clickable(onClick = onClick)) {
        CatalogPhoto(
            url = destination.imageUrl,
            contentDescription = destination.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(AppSpacing.xxxl * 4),
        )
        Text(destination.name, style = AppTypography.title)
        Text(destination.seasonalNote, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
    }
}

@Composable
private fun DestinationResultCard(destination: Destination, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier
            .testTag("destinations.card.${destination.id}")
            .clickable(onClick = onClick),
    ) {
        CatalogPhoto(
            url = destination.imageUrl,
            contentDescription = destination.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(AppSpacing.xxxl * 5),
        )
        Text(destination.country, style = AppTypography.caption, color = AppTheme.colors.tertiary)
        Text(destination.name, style = AppTypography.headline)
        Text(destination.tagline, style = AppTypography.body, color = AppTheme.colors.primary)
        Text(destination.description, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        Text(stringResource(R.string.destinations_capacity, destination.guestCapacityMax), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
        Text(stringResource(R.string.destinations_budget_from, formatAmount(destination.budgetMin)), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
        Text(stringResource(R.string.destinations_explore), style = AppTypography.label, color = AppTheme.colors.primary)
    }
}
