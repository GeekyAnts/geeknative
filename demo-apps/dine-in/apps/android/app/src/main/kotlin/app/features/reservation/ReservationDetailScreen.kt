package app.features.reservation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.EmptyState
import app.core.designsystem.GoldRule
import app.core.designsystem.Overline
import app.core.designsystem.PrimaryButton
import app.core.designsystem.PushedScreen
import app.core.designsystem.ScreenHeader
import app.core.designsystem.SecondaryButton
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.Restaurant
import app.features.catalog.rememberFormatters
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

data class ReservationDetailUiState(
    val loading: Boolean = true,
    val reservation: Reservation? = null,
    val restaurant: Restaurant? = null,
    val now: LocalDateTime = LocalDateTime.MIN,
)

class ReservationDetailViewModel(
    private val reservationId: String,
    catalog: CatalogRepository,
    private val reservations: ReservationsRepository,
    clock: Clock,
) : ViewModel() {
    val uiState: StateFlow<ReservationDetailUiState> = combine(
        CatalogLoader(catalog).state,
        reservations.reservations,
    ) { load, list ->
        val reservation = list.firstOrNull { it.id == reservationId }
        val restaurant = (load as? CatalogLoad.Loaded)?.catalog?.restaurant(reservation?.restaurantId.orEmpty())
        ReservationDetailUiState(
            loading = load == CatalogLoad.Loading,
            reservation = reservation,
            restaurant = restaurant,
            now = LocalDateTime.now(clock),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ReservationDetailUiState())

    fun cancel() {
        viewModelScope.launch { runCatching { reservations.cancel(reservationId) } }
    }
}

@Composable
fun ConfirmationScreen(
    viewModel: ReservationDetailViewModel,
    onBack: () -> Unit,
    onDone: () -> Unit,
    onOpenReservations: () -> Unit,
    onOpenRestaurant: (String) -> Unit,
    onModify: (String, String) -> Unit,
    onRebook: (String, String) -> Unit,
) {
    ReservationDetailContent(
        viewModel = viewModel,
        onBack = onBack,
        confirmation = true,
        onDone = onDone,
        onOpenReservations = onOpenReservations,
        onOpenRestaurant = onOpenRestaurant,
        onModify = onModify,
        onRebook = onRebook,
    )
}

@Composable
fun ReservationDetailScreen(
    viewModel: ReservationDetailViewModel,
    onBack: () -> Unit,
    onOpenRestaurant: (String) -> Unit,
    onModify: (String, String) -> Unit,
    onRebook: (String, String) -> Unit,
) {
    ReservationDetailContent(
        viewModel = viewModel,
        onBack = onBack,
        confirmation = false,
        onDone = onBack,
        onOpenReservations = onBack,
        onOpenRestaurant = onOpenRestaurant,
        onModify = onModify,
        onRebook = onRebook,
    )
}

@Composable
private fun ReservationDetailContent(
    viewModel: ReservationDetailViewModel,
    onBack: () -> Unit,
    confirmation: Boolean,
    onDone: () -> Unit,
    onOpenReservations: () -> Unit,
    onOpenRestaurant: (String) -> Unit,
    onModify: (String, String) -> Unit,
    onRebook: (String, String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val reservation = state.reservation
    val restaurant = state.restaurant
    val formatters = rememberFormatters()
    val colors = AppTheme.colors
    var confirmingCancel by remember { mutableStateOf(false) }
    val title = stringResource(if (confirmation) R.string.confirmation_title else R.string.reservation_title)
    if (!state.loading && reservation == null) {
        PushedScreen(onBack = onBack, title = title) {
            item {
                EmptyState(
                    icon = AppIcons.calendar,
                    title = stringResource(R.string.reservation_not_found_title),
                    body = stringResource(R.string.reservation_not_found_body),
                )
            }
        }
        return
    }
    PushedScreen(onBack = onBack, title = title) {
        if (confirmation) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    Overline(stringResource(R.string.confirmation_overline))
                    GoldRule()
                    Text(stringResource(R.string.confirmation_title), style = AppSerif.hero, color = colors.onBackground)
                    restaurant?.let {
                        Text(stringResource(R.string.confirmation_body, it.name), style = AppTypography.body, color = colors.onSurfaceVariant)
                    }
                }
            }
        } else {
            item { ScreenHeader(title = title, subtitle = restaurant?.name) }
        }
        if (reservation != null) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                    Text(stringResource(R.string.confirmation_code), style = AppTypography.caption, color = colors.onSurfaceVariant)
                    Text(reservation.confirmationCode, style = AppSerif.headline, color = colors.onSurface, modifier = Modifier.testTag("confirmation.code"))
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    DetailRow(stringResource(R.string.reserve_summary_when), formatters.separator(formatters.dateLong(reservation.date), formatters.time(reservation.time)))
                    DetailRow(stringResource(R.string.reserve_summary_party), AppPlurals.reserveGuestCount(reservation.partySize))
                    DetailRow(stringResource(R.string.reserve_summary_seating), stringResource(reservation.seating.label))
                    if (reservation.occasion != app.features.catalog.Occasion.None) {
                        DetailRow(stringResource(R.string.reserve_summary_occasion), stringResource(reservation.occasion.label))
                    }
                    if (reservation.notes.isNotBlank()) {
                        DetailRow(stringResource(R.string.reserve_summary_notes), reservation.notes)
                    }
                }
            }
            restaurant?.let { place ->
                item {
                    SecondaryButton(
                        text = stringResource(R.string.reservations_view_restaurant),
                        onClick = { onOpenRestaurant(place.id) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                if (reservation.isUpcoming(state.now)) {
                    item {
                        SecondaryButton(
                            text = stringResource(R.string.reservations_modify),
                            onClick = { onModify(place.id, reservation.id) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    item {
                        SecondaryButton(
                            text = stringResource(R.string.confirmation_cancel),
                            onClick = { confirmingCancel = true },
                            modifier = Modifier.fillMaxWidth(),
                            color = colors.error,
                        )
                    }
                } else if (!reservation.isCancelled) {
                    item {
                        SecondaryButton(
                            text = stringResource(R.string.reservations_rebook),
                            onClick = { onRebook(place.id, reservation.id) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
            if (confirmation) {
                item {
                    PrimaryButton(
                        text = stringResource(R.string.confirmation_done),
                        onClick = onDone,
                        modifier = Modifier.fillMaxWidth().testTag("confirmation.done"),
                    )
                }
                item {
                    SecondaryButton(
                        text = stringResource(R.string.confirmation_view_reservations),
                        onClick = onOpenReservations,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
    if (confirmingCancel && reservation != null && restaurant != null) {
        AlertDialog(
            onDismissRequest = { confirmingCancel = false },
            title = { Text(stringResource(R.string.cancel_title)) },
            text = {
                Text(
                    stringResource(
                        R.string.cancel_body,
                        restaurant.name,
                        formatters.dateLong(reservation.date),
                        formatters.time(reservation.time),
                    ),
                )
            },
            confirmButton = {
                TextButton(onClick = { confirmingCancel = false; viewModel.cancel() }) {
                    Text(stringResource(R.string.cancel_confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmingCancel = false }) { Text(stringResource(R.string.cancel_keep)) }
            },
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs)) {
        Text(label, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
        Text(value, style = AppTypography.body, color = AppTheme.colors.onSurface)
    }
}
