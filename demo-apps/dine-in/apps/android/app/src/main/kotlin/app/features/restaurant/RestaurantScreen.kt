package app.features.restaurant

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.AvailabilityIndicator
import app.core.designsystem.EmptyState
import app.core.designsystem.ErrorState
import app.core.designsystem.FavouriteButton
import app.core.designsystem.GoldRule
import app.core.designsystem.Overline
import app.core.designsystem.PhotoScrim
import app.core.designsystem.PriceLevel
import app.core.designsystem.PrimaryButton
import app.core.designsystem.PushedScreen
import app.core.designsystem.RatingBadge
import app.core.designsystem.RemoteImage
import app.core.designsystem.SecondaryButton
import app.core.designsystem.StickyActionBar
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import app.features.catalog.TodayAvailability
import app.features.catalog.rememberFormatters
import app.features.saved.SavedRepository
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.Clock
import java.time.LocalDateTime
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class RestaurantUiState(
    val loading: Boolean = true,
    val failed: Boolean = false,
    val restaurant: Restaurant? = null,
    val saved: Boolean = false,
    val availability: TodayAvailability = TodayAvailability.Closed,
)

class RestaurantViewModel(
    private val restaurantId: String,
    catalog: CatalogRepository,
    private val saved: SavedRepository,
    clock: Clock,
) : ViewModel() {
    private val loader = CatalogLoader(catalog)

    val uiState: StateFlow<RestaurantUiState> = combine(loader.state, saved.savedIds) { load, ids ->
        when (load) {
            CatalogLoad.Loading -> RestaurantUiState()
            CatalogLoad.Failed -> RestaurantUiState(loading = false, failed = true)
            is CatalogLoad.Loaded -> {
                val restaurant = load.catalog.restaurant(restaurantId)
                RestaurantUiState(
                    loading = false,
                    restaurant = restaurant,
                    saved = restaurantId in ids,
                    availability = restaurant?.let { DemoAvailability.today(it, LocalDateTime.now(clock)) } ?: TodayAvailability.Closed,
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), RestaurantUiState())

    fun toggleSaved() {
        viewModelScope.launch { saved.toggle(restaurantId) }
    }

    fun retry() = loader.retry()
}

@Composable
fun RestaurantScreen(viewModel: RestaurantViewModel, onBack: () -> Unit, onReserve: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val restaurant = state.restaurant
    if (state.failed) {
        PushedScreen(onBack = onBack, title = stringResource(R.string.restaurant_not_found_title)) {
            item { ErrorState(onRetry = viewModel::retry) }
        }
        return
    }
    if (!state.loading && restaurant == null) {
        PushedScreen(onBack = onBack, title = stringResource(R.string.restaurant_not_found_title)) {
            item {
                EmptyState(
                    icon = AppIcons.utensils,
                    title = stringResource(R.string.restaurant_not_found_title),
                    body = stringResource(R.string.restaurant_not_found_body),
                )
            }
        }
        return
    }
    val formatters = rememberFormatters()
    val colors = AppTheme.colors
    val context = LocalContext.current
    Box(Modifier.fillMaxSize()) {
        PushedScreen(onBack = onBack, title = restaurant?.name) {
            item {
                Box(Modifier.fillMaxWidth().aspectRatio(4f / 3f)) {
                    RemoteImage(restaurant?.heroImage, contentDescription = restaurant?.name, modifier = Modifier.fillMaxSize())
                    PhotoScrim()
                    if (restaurant != null) {
                        FavouriteButton(
                            saved = state.saved,
                            onToggle = viewModel::toggleSaved,
                            restaurantId = restaurant.id,
                            modifier = Modifier.align(Alignment.TopEnd).padding(AppSpacing.lg),
                        )
                    }
                }
            }
            if (restaurant != null) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                        Overline(stringResource(restaurant.cuisine.label))
                        GoldRule()
                        Text(restaurant.name, style = AppSerif.display, color = colors.onBackground)
                        Text(restaurant.tagline, style = AppTypography.body, color = colors.onSurfaceVariant)
                        RatingBadge(restaurant.rating)
                        Text(AppPlurals.restaurantReviewCount(restaurant.reviewCount), style = AppTypography.caption, color = colors.onSurfaceVariant)
                        Text(
                            formatters.separator(restaurant.neighbourhood, formatters.price(restaurant.costForTwo)),
                            style = AppTypography.caption,
                            color = colors.onSurfaceVariant,
                        )
                        PriceLevel(restaurant.priceLevel)
                        AvailabilityIndicator(state.availability)
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                        Text(stringResource(R.string.restaurant_about), style = AppSerif.title, color = colors.onBackground)
                        Text(restaurant.about, style = AppTypography.body, color = colors.onSurface)
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                        Text(stringResource(R.string.restaurant_location), style = AppSerif.title, color = colors.onBackground)
                        Text(restaurant.address, style = AppTypography.body, color = colors.onSurface)
                        SecondaryButton(
                            text = stringResource(R.string.restaurant_directions),
                            onClick = {
                                val uri = Uri.parse("geo:${restaurant.latitude},${restaurant.longitude}?q=${Uri.encode(restaurant.address)}")
                                context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                            },
                        )
                        SecondaryButton(
                            text = stringResource(R.string.restaurant_call),
                            onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${restaurant.phone}"))) },
                        )
                    }
                }
                items(restaurant.signatureDishes, key = { it.name }) { dish ->
                    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                        Text(dish.name, style = AppSerif.title, color = colors.onSurface)
                        Text(dish.description, style = AppTypography.body, color = colors.onSurfaceVariant)
                        Text(formatters.price(dish.price), style = AppTypography.caption, color = colors.accent)
                    }
                }
            }
        }
        if (restaurant != null) {
            StickyActionBar(modifier = Modifier.align(Alignment.BottomCenter)) {
                PrimaryButton(
                    text = stringResource(R.string.restaurant_reserve),
                    onClick = onReserve,
                    modifier = Modifier.fillMaxWidth().testTag("restaurant.reserve"),
                )
            }
        }
    }
}
