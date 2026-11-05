package app.features.reservations

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.Chip
import app.core.designsystem.EmptyState
import app.core.designsystem.GoldRule
import app.core.designsystem.ScreenHeader
import app.core.designsystem.tabBarClearance
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.Restaurant
import app.features.catalog.rememberFormatters
import app.features.reservation.Reservation
import app.features.reservation.ReservationsRepository
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.Clock
import java.time.LocalDateTime
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

enum class ReservationSegment { Upcoming, Past, Cancelled }

data class ReservationsUiState(
    val loading: Boolean = true,
    val reservations: List<Reservation> = emptyList(),
    val restaurants: Map<String, Restaurant> = emptyMap(),
    val now: LocalDateTime = LocalDateTime.MIN,
)

class ReservationsViewModel(
    catalog: CatalogRepository,
    reservations: ReservationsRepository,
    clock: Clock,
) : ViewModel() {
    val uiState: StateFlow<ReservationsUiState> = combine(
        CatalogLoader(catalog).state,
        reservations.reservations,
    ) { load, list ->
        val catalogData = (load as? CatalogLoad.Loaded)?.catalog
        ReservationsUiState(
            loading = load == CatalogLoad.Loading,
            reservations = list,
            restaurants = catalogData?.restaurants?.associateBy { it.id }.orEmpty(),
            now = LocalDateTime.now(clock),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ReservationsUiState())
}

@Composable
fun ReservationsScreen(
    viewModel: ReservationsViewModel,
    onOpenReservation: (String) -> Unit,
    onDiscover: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var segment by rememberSaveable { mutableStateOf(ReservationSegment.Upcoming) }
    val visible = state.reservations.filter {
        when (segment) {
            ReservationSegment.Upcoming -> it.isUpcoming(state.now)
            ReservationSegment.Past -> it.isPast(state.now)
            ReservationSegment.Cancelled -> it.isCancelled
        }
    }
    val formatters = rememberFormatters()
    val colors = AppTheme.colors
    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding().testTag("reservations.list"),
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
                title = stringResource(R.string.reservations_title),
                subtitle = stringResource(R.string.reservations_subtitle),
            )
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                item {
                    Chip(stringResource(R.string.reservations_tab_upcoming), segment == ReservationSegment.Upcoming, { segment = ReservationSegment.Upcoming })
                }
                item {
                    Chip(stringResource(R.string.reservations_tab_past), segment == ReservationSegment.Past, { segment = ReservationSegment.Past })
                }
                item {
                    Chip(stringResource(R.string.reservations_tab_cancelled), segment == ReservationSegment.Cancelled, { segment = ReservationSegment.Cancelled })
                }
            }
        }
        if (!state.loading && visible.isEmpty()) {
            item {
                val (title, body) = when (segment) {
                    ReservationSegment.Upcoming -> R.string.reservations_empty_upcoming_title to R.string.reservations_empty_upcoming_body
                    ReservationSegment.Past -> R.string.reservations_empty_past_title to R.string.reservations_empty_past_body
                    ReservationSegment.Cancelled -> R.string.reservations_empty_cancelled_title to R.string.reservations_empty_cancelled_body
                }
                EmptyState(
                    icon = AppIcons.calendar,
                    title = stringResource(title),
                    body = stringResource(body),
                    actionLabel = if (segment == ReservationSegment.Upcoming) stringResource(R.string.reservations_empty_cta) else null,
                    onAction = if (segment == ReservationSegment.Upcoming) onDiscover else null,
                    modifier = Modifier.testTag("reservations.empty"),
                )
            }
        }
        items(visible, key = { it.id }) { reservation ->
            val restaurant = state.restaurants[reservation.restaurantId]
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppRadius.lg))
                    .background(colors.surface)
                    .clickable { onOpenReservation(reservation.id) }
                    .padding(AppSpacing.lg)
                    .testTag("reservations.item.${reservation.id}"),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
            ) {
                GoldRule()
                Text(restaurant?.name.orEmpty(), style = AppSerif.title, color = colors.onSurface)
                Text(
                    formatters.separator(formatters.dateLong(reservation.date), formatters.time(reservation.time)),
                    style = AppTypography.body,
                    color = colors.onSurfaceVariant,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    val status = when {
                        reservation.isCancelled -> R.string.reservations_status_cancelled
                        reservation.isUpcoming(state.now) -> R.string.reservations_status_confirmed
                        else -> R.string.reservations_status_completed
                    }
                    Text(stringResource(status), style = AppTypography.caption, color = colors.accent)
                    Text(stringResource(reservation.seating.label), style = AppTypography.caption, color = colors.onSurfaceVariant)
                }
            }
        }
    }
}
