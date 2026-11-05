package app.features.saved

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.EmptyState
import app.core.designsystem.ErrorState
import app.core.designsystem.RestaurantListItem
import app.core.designsystem.ScreenHeader
import app.core.designsystem.tabBarClearance
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import app.features.catalog.TodayAvailability
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSpacing
import java.time.Clock
import java.time.LocalDateTime
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SavedUiState(
    val loading: Boolean = true,
    val failed: Boolean = false,
    val restaurants: List<Restaurant> = emptyList(),
    val availability: Map<String, TodayAvailability> = emptyMap(),
)

class SavedViewModel(
    catalog: CatalogRepository,
    private val saved: SavedRepository,
    private val clock: Clock,
) : ViewModel() {
    private val loader = CatalogLoader(catalog)

    val uiState: StateFlow<SavedUiState> = combine(loader.state, saved.savedIds) { load, ids ->
        when (load) {
            CatalogLoad.Loading -> SavedUiState()
            CatalogLoad.Failed -> SavedUiState(loading = false, failed = true)
            is CatalogLoad.Loaded -> {
                val now = LocalDateTime.now(clock)
                val restaurants = ids.mapNotNull { load.catalog.restaurant(it) }
                SavedUiState(
                    loading = false,
                    restaurants = restaurants,
                    availability = restaurants.associate { it.id to DemoAvailability.today(it, now) },
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SavedUiState())

    fun toggle(id: String) { viewModelScope.launch { saved.toggle(id) } }

    fun retry() = loader.retry()
}

@Composable
fun SavedScreen(
    viewModel: SavedViewModel,
    onOpenRestaurant: (String) -> Unit,
    onExplore: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding().testTag("saved.list"),
        contentPadding = PaddingValues(
            start = AppSpacing.lg,
            end = AppSpacing.lg,
            top = AppSpacing.lg,
            bottom = tabBarClearance() + AppSpacing.lg,
        ),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
    ) {
        item {
            ScreenHeader(
                title = stringResource(R.string.saved_title),
                subtitle = if (state.loading) stringResource(R.string.saved_subtitle) else AppPlurals.savedCount(state.restaurants.size),
            )
        }
        if (state.failed) item { ErrorState(onRetry = viewModel::retry) }
        if (!state.loading && !state.failed && state.restaurants.isEmpty()) {
            item {
                EmptyState(
                    icon = AppIcons.heart,
                    title = stringResource(R.string.saved_empty_title),
                    body = stringResource(R.string.saved_empty_body),
                    actionLabel = stringResource(R.string.saved_empty_cta),
                    onAction = onExplore,
                    modifier = Modifier.testTag("saved.empty"),
                )
            }
        }
        items(state.restaurants, key = { it.id }) { restaurant ->
            RestaurantListItem(
                restaurant = restaurant,
                availability = state.availability[restaurant.id] ?: TodayAvailability.Closed,
                saved = true,
                onToggleSaved = { viewModel.toggle(restaurant.id) },
                onClick = { onOpenRestaurant(restaurant.id) },
            )
        }
    }
}
