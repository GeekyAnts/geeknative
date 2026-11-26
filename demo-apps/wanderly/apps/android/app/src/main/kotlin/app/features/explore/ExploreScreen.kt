package app.features.explore

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.CategoryChipRow
import app.core.designsystem.PhotoMetaCard
import app.core.designsystem.SearchField
import app.core.designsystem.SectionHeader
import app.features.catalog.PlaceKind
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun ExploreScreen(
    viewModel: ExploreViewModel,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ExploreContent(
        state = state,
        onQueryChange = viewModel::onQueryChange,
        onCategory = { viewModel.onCategory(it) },
        onClearFilters = viewModel::clearFilters,
        onOpenCity = onOpenCity,
        onOpenPlace = onOpenPlace,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreContent(
    state: ExploreUiState,
    onQueryChange: (String) -> Unit,
    onCategory: (String) -> Unit,
    onClearFilters: () -> Unit,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(stringResource(R.string.explore_title), modifier = Modifier.testTag("explore.title"))
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            SearchField(
                value = state.query,
                onValueChange = onQueryChange,
                placeholder = stringResource(R.string.explore_search_placeholder),
                testTag = "explore.search",
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
            )
            CategoryChipRow(
                selectedIds = setOfNotNull(state.category),
                onSelect = { onCategory(it.id) },
                testTagPrefix = "explore.category",
            )

            if (state.empty) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(AppSpacing.lg)
                        .testTag("explore.empty"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    Text(stringResource(R.string.explore_empty_title), style = AppTypography.title)
                    Text(
                        stringResource(R.string.explore_empty_body),
                        style = AppTypography.body,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                    TextButton(onClick = onClearFilters, modifier = Modifier.testTag("explore.clearFilters")) {
                        Text(stringResource(R.string.explore_clear_filters))
                    }
                }
            } else {
                SectionHeader(stringResource(R.string.explore_destinations_title))
                Column(
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    state.destinations.chunked(2).forEach { row ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                        ) {
                            row.forEach { destination ->
                                PhotoMetaCard(
                                    imageUrl = destination.imageUrl,
                                    fallbackUrl = state.fallbackImageUrl,
                                    contentDescription = destination.name,
                                    modifier = Modifier.weight(1f).testTag("explore.destination.${destination.id}"), // geeknative-ignore
                                    onClick = { onOpenCity(destination.id) },
                                ) {
                                    Text(destination.name, style = AppTypography.title)
                                    Text(
                                        destination.country,
                                        style = AppTypography.caption,
                                        color = AppTheme.colors.onSurfaceVariant,
                                    )
                                }
                            }
                            if (row.size == 1) Spacer(Modifier.weight(1f))
                        }
                    }
                }

                if (state.places.isNotEmpty()) {
                    SectionHeader(stringResource(R.string.explore_places_title))
                    Column(
                        modifier = Modifier.padding(horizontal = AppSpacing.lg),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    ) {
                        state.places.forEach { place ->
                            PhotoMetaCard(
                                imageUrl = place.imageUrl,
                                fallbackUrl = state.fallbackImageUrl,
                                contentDescription = place.name,
                                modifier = Modifier.testTag("explore.place.${place.id}"), // geeknative-ignore
                                onClick = { onOpenPlace(place.id) },
                            ) {
                                Text(place.name, style = AppTypography.title)
                                Text(
                                    stringResource(PlaceKind.fromId(place.kind).label),
                                    style = AppTypography.label,
                                    color = AppTheme.colors.primary,
                                )
                                Text(
                                    state.destinationNames[place.destinationId].orEmpty(),
                                    style = AppTypography.caption,
                                    color = AppTheme.colors.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Preview
@Composable
private fun ExploreScreenPreview() {
    AppTheme(darkTheme = false) {
        ExploreContent(
            state = ExploreUiState(),
            onQueryChange = {},
            onCategory = {},
            onClearFilters = {},
            onOpenCity = {},
            onOpenPlace = {},
        )
    }
}
