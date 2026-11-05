package app.features.explore

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTextField
import app.core.designsystem.Chip
import app.core.designsystem.EmptyState
import app.core.designsystem.ErrorState
import app.core.designsystem.RestaurantGridItem
import app.core.designsystem.RestaurantListItem
import app.core.designsystem.ScreenHeader
import app.core.designsystem.tabBarClearance
import app.features.catalog.CuisineId
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSpacing

@Composable
fun ExploreScreen(
    viewModel: ExploreViewModel,
    request: ExploreRequest?,
    onOpenRestaurant: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(request?.id) {
        request?.let { viewModel.apply(it) }
    }
    ExploreContent(
        state = state,
        onQuery = viewModel::setQuery,
        onClearQuery = viewModel::clearQuery,
        onToggleCuisine = viewModel::toggleCuisine,
        onToggleAvailable = viewModel::toggleAvailableToday,
        onToggleView = viewModel::toggleViewMode,
        onToggleSaved = viewModel::toggleSaved,
        onRetry = viewModel::retry,
        onOpenRestaurant = onOpenRestaurant,
    )
}

@Composable
private fun ExploreContent(
    state: ExploreUiState,
    onQuery: (String) -> Unit,
    onClearQuery: () -> Unit,
    onToggleCuisine: (CuisineId) -> Unit,
    onToggleAvailable: () -> Unit,
    onToggleView: () -> Unit,
    onToggleSaved: (String) -> Unit,
    onRetry: () -> Unit,
    onOpenRestaurant: (String) -> Unit,
) {
    val padding = PaddingValues(
        start = AppSpacing.lg,
        end = AppSpacing.lg,
        top = AppSpacing.lg,
        bottom = tabBarClearance() + AppSpacing.lg,
    )
    if (state.failed) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(AppSpacing.lg), verticalArrangement = Arrangement.Center) {
            ErrorState(onRetry = onRetry)
        }
        return
    }
    if (state.viewMode == ExploreViewMode.Grid) {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxSize().statusBarsPadding().testTag("explore.grid"),
            contentPadding = padding,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            item(span = { GridItemSpan(2) }) {
                ExploreHeader(state, onQuery, onClearQuery, onToggleCuisine, onToggleAvailable, onToggleView)
            }
            if (!state.loading && state.results.isEmpty()) {
                item(span = { GridItemSpan(2) }) { ExploreEmpty() }
            }
            items(state.results, key = { it.id }) { restaurant ->
                RestaurantGridItem(restaurant, onClick = { onOpenRestaurant(restaurant.id) })
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().statusBarsPadding().testTag("explore.list"),
            contentPadding = padding,
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            item { ExploreHeader(state, onQuery, onClearQuery, onToggleCuisine, onToggleAvailable, onToggleView) }
            if (!state.loading && state.results.isEmpty()) {
                item { ExploreEmpty() }
            }
            items(state.results, key = { it.id }) { restaurant ->
                RestaurantListItem(
                    restaurant = restaurant,
                    availability = state.availability[restaurant.id] ?: app.features.catalog.TodayAvailability.Closed,
                    saved = restaurant.id in state.savedIds,
                    onToggleSaved = { onToggleSaved(restaurant.id) },
                    onClick = { onOpenRestaurant(restaurant.id) },
                )
            }
        }
    }
}

@Composable
private fun ExploreHeader(
    state: ExploreUiState,
    onQuery: (String) -> Unit,
    onClearQuery: () -> Unit,
    onToggleCuisine: (CuisineId) -> Unit,
    onToggleAvailable: () -> Unit,
    onToggleView: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        ScreenHeader(
            title = stringResource(R.string.explore_title),
            subtitle = if (state.loading) null else AppPlurals.exploreResults(state.results.size),
        )
        AppTextField(
            value = state.controls.queryText,
            onValueChange = onQuery,
            label = stringResource(R.string.explore_search_placeholder),
            leadingIcon = AppIcons.search,
            trailing = if (state.controls.queryText.isNotEmpty()) {
                {
                    IconButton(onClick = onClearQuery) {
                        Icon(AppIcons.close, contentDescription = stringResource(R.string.explore_clear_search))
                    }
                }
            } else {
                null
            },
            modifier = Modifier.testTag("explore.search"),
        )
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Chip(
                label = stringResource(R.string.explore_filter_available_today),
                selected = state.filters.availableToday,
                onClick = onToggleAvailable,
            )
            IconButton(onClick = onToggleView, modifier = Modifier.testTag("explore.viewMode")) {
                Icon(
                    if (state.viewMode == ExploreViewMode.List) AppIcons.grid else AppIcons.list,
                    contentDescription = stringResource(
                        if (state.viewMode == ExploreViewMode.List) R.string.explore_view_grid else R.string.explore_view_list,
                    ),
                )
            }
        }
        LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            items(CuisineId.entries, key = { it.id }) { cuisine ->
                Chip(
                    label = stringResource(cuisine.label),
                    selected = cuisine in state.filters.cuisines,
                    onClick = { onToggleCuisine(cuisine) },
                )
            }
        }
    }
}

@Composable
private fun ExploreEmpty() {
    EmptyState(
        icon = AppIcons.utensils,
        title = stringResource(R.string.explore_empty_title),
        body = stringResource(R.string.explore_empty_body),
        modifier = Modifier.testTag("explore.empty"),
    )
}
