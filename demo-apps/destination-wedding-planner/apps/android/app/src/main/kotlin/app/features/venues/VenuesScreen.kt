package app.features.venues

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import app.features.catalog.Venue
import app.features.catalog.formatAmount
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun VenuesScreen(
    viewModel: VenuesViewModel,
    onOpenVenue: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    VenuesContent(
        state = state,
        onDestinationChange = viewModel::setDestination,
        onGuestsChange = viewModel::setGuests,
        onBudgetChange = viewModel::setBudget,
        onOpenVenue = onOpenVenue,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VenuesContent(
    state: VenuesUiState,
    onDestinationChange: (String) -> Unit,
    onGuestsChange: (String) -> Unit,
    onBudgetChange: (String) -> Unit,
    onOpenVenue: (String) -> Unit,
) {
    Scaffold(
        containerColor = AppTheme.colors.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.venues_title)) },
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
            Text(stringResource(R.string.venues_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
            DestinationFilter(
                selectedId = state.destinationId,
                destinations = state.destinations,
                onDestinationChange = onDestinationChange,
            )
            AppTextField(
                value = state.guests,
                onValueChange = onGuestsChange,
                label = stringResource(R.string.destinations_filter_guests),
                keyboardType = KeyboardType.Number,
            )
            AppTextField(
                value = state.budget,
                onValueChange = onBudgetChange,
                label = stringResource(R.string.destinations_filter_budget),
                keyboardType = KeyboardType.Number,
            )
            if (state.results.isEmpty()) {
                AppCard {
                    Text(stringResource(R.string.venues_empty_title), style = AppTypography.title)
                    Text(stringResource(R.string.venues_empty_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                }
            } else {
                Column(
                    modifier = Modifier.testTag("venues.list"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
                ) {
                    state.results.forEach { venue ->
                        VenueCard(venue = venue, onClick = { onOpenVenue(venue.id) })
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DestinationFilter(
    selectedId: String,
    destinations: List<app.features.catalog.Destination>,
    onDestinationChange: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedName = destinations.find { it.id == selectedId }?.name ?: stringResource(R.string.venues_filter_all_destinations)
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = Modifier.testTag("venues.filter.destination")) {
        OutlinedTextField(
            value = selectedName,
            onValueChange = {},
            readOnly = true,
            label = { Text(stringResource(R.string.venues_filter_destination)) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier
                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                .fillMaxWidth(),
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuItem(
                text = { Text(stringResource(R.string.venues_filter_all_destinations)) },
                onClick = {
                    onDestinationChange("")
                    expanded = false
                },
            )
            destinations.forEach { destination ->
                DropdownMenuItem(
                    text = { Text(destination.name) },
                    onClick = {
                        onDestinationChange(destination.id)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun VenueCard(venue: Venue, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier
            .testTag("venues.card.${venue.id}")
            .clickable(onClick = onClick),
    ) {
        CatalogPhoto(
            url = venue.imageUrl,
            contentDescription = venue.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(AppSpacing.xxxl * 5),
        )
        Text(venue.name, style = AppTypography.headline)
        Text(venue.location, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        Text(stringResource(R.string.venues_capacity, venue.capacity), style = AppTypography.label)
        Text(stringResource(R.string.venues_price_from, formatAmount(venue.priceFrom)), style = AppTypography.label)
    }
}
