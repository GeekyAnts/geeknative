package app.features.reservation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.designsystem.AppTextField
import app.core.designsystem.Chip
import app.core.designsystem.DemoNote
import app.core.designsystem.ErrorState
import app.core.designsystem.PrimaryButton
import app.core.designsystem.PushedScreen
import app.core.designsystem.ScreenHeader
import app.features.catalog.CatalogRepository
import app.features.catalog.DemoAvailability
import app.features.catalog.Occasion
import app.features.catalog.Restaurant
import app.features.catalog.Seating
import app.features.catalog.Slot
import app.features.catalog.rememberFormatters
import app.features.profile.DiningPreferences
import app.features.profile.PreferencesRepository
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ReserveUiState(
    val loading: Boolean = true,
    val failed: Boolean = false,
    val restaurant: Restaurant? = null,
    val modifying: Boolean = false,
    val date: LocalDate = LocalDate.now(),
    val time: String? = null,
    val partySize: Int = DiningPreferences.DEFAULT_PARTY_SIZE,
    val seating: Seating = Seating.Indoor,
    val occasion: Occasion = Occasion.None,
    val notes: String = "",
    val dates: List<LocalDate> = emptyList(),
    val slots: List<Slot> = emptyList(),
    val submitting: Boolean = false,
    val error: ReservationError? = null,
)

class ReserveViewModel(
    private val restaurantId: String,
    private val reservationId: String?,
    private val rebookReservationId: String?,
    private val catalog: CatalogRepository,
    private val reservations: ReservationsRepository,
    private val preferences: PreferencesRepository,
    private val clock: Clock,
) : ViewModel() {
    private val state = MutableStateFlow(ReserveUiState())
    val uiState: StateFlow<ReserveUiState> = state.asStateFlow()

    init {
        viewModelScope.launch { load() }
    }

    private suspend fun load() {
        val restaurant = runCatching { catalog.load().restaurant(restaurantId) }.getOrNull()
        if (restaurant == null) {
            state.update { it.copy(loading = false, failed = true) }
            return
        }
        val now = LocalDateTime.now(clock)
        val prefs = preferences.load()
        val editing = reservationId?.let { reservations.get(it) }
        val rebook = rebookReservationId?.let { reservations.get(it) }
        val date = editing?.date ?: DemoAvailability.bookableDates(now).firstOrNull { DemoAvailability.slots(restaurant, it, now).any { slot -> slot.available } } ?: now.toLocalDate()
        val party = editing?.partySize ?: rebook?.partySize ?: prefs.partySize.coerceAtMost(restaurant.maxPartySize)
        val seating = editing?.seating ?: rebook?.seating ?: prefs.seating.let { if (it in restaurant.seating) it else restaurant.seating.first() }
        refresh(
            restaurant = restaurant,
            date = date,
            time = editing?.time,
            partySize = party,
            seating = seating,
            occasion = editing?.occasion ?: Occasion.None,
            notes = editing?.notes.orEmpty(),
            modifying = editing != null,
        )
    }

    fun setDate(date: LocalDate) {
        val restaurant = state.value.restaurant ?: return
        refresh(restaurant, date, null, state.value.partySize, state.value.seating, state.value.occasion, state.value.notes, state.value.modifying)
    }

    fun setTime(time: String) = state.update { it.copy(time = time, error = null) }

    fun setPartySize(size: Int) {
        val max = state.value.restaurant?.maxPartySize ?: DiningPreferences.MAX_PARTY_SIZE
        state.update { it.copy(partySize = size.coerceIn(DiningPreferences.MIN_PARTY_SIZE, max)) }
    }

    fun setSeating(seating: Seating) = state.update { it.copy(seating = seating) }

    fun setOccasion(occasion: Occasion) = state.update { it.copy(occasion = occasion) }

    fun setNotes(notes: String) = state.update { it.copy(notes = notes.take(ReservationValidator.MAX_NOTES_LENGTH)) }

    fun retry() { viewModelScope.launch { load() } }

    fun submit(onConfirmed: (String) -> Unit) {
        val current = state.value
        if (current.submitting) return
        val restaurant = current.restaurant ?: return
        val draft = ReservationDraft(
            restaurantId = restaurant.id,
            date = current.date,
            time = current.time,
            partySize = current.partySize,
            seating = current.seating,
            occasion = current.occasion,
            notes = current.notes,
        )
        state.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            try {
                val saved = if (reservationId != null) reservations.update(reservationId, draft) else reservations.create(draft)
                state.update { it.copy(submitting = false) }
                onConfirmed(saved.id)
            } catch (e: ReservationException) {
                state.update { it.copy(submitting = false, error = e.error) }
            }
        }
    }

    private fun refresh(
        restaurant: Restaurant,
        date: LocalDate,
        time: String?,
        partySize: Int,
        seating: Seating,
        occasion: Occasion,
        notes: String,
        modifying: Boolean,
    ) {
        val now = LocalDateTime.now(clock)
        val slots = DemoAvailability.slots(restaurant, date, now)
        state.value = ReserveUiState(
            loading = false,
            restaurant = restaurant,
            modifying = modifying,
            date = date,
            time = time?.takeIf { slot -> slots.any { it.time == slot && it.available } } ?: slots.firstOrNull { it.available }?.time,
            partySize = partySize,
            seating = seating,
            occasion = occasion,
            notes = notes,
            dates = DemoAvailability.bookableDates(now),
            slots = slots,
        )
    }
}

@Composable
fun ReserveScreen(viewModel: ReserveViewModel, onBack: () -> Unit, onConfirmed: (String) -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val formatters = rememberFormatters()
    val title = stringResource(if (state.modifying) R.string.reserve_modify_title else R.string.reserve_title)
    if (state.failed) {
        PushedScreen(onBack = onBack, title = title) { item { ErrorState(onRetry = viewModel::retry) } }
        return
    }
    val restaurant = state.restaurant
    PushedScreen(onBack = onBack, title = title) {
        item { ScreenHeader(title = title, subtitle = restaurant?.name) }
        item { DemoNote() }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.reserve_guests), style = AppTypography.subtitle)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    IconButton(onClick = { viewModel.setPartySize(state.partySize - 1) }) {
                        Icon(AppIcons.minus, contentDescription = stringResource(R.string.reserve_remove_guest))
                    }
                    Text(AppPlurals.reserveGuestCount(state.partySize), style = AppTypography.body)
                    IconButton(onClick = { viewModel.setPartySize(state.partySize + 1) }) {
                        Icon(AppIcons.plus, contentDescription = stringResource(R.string.reserve_add_guest))
                    }
                }
                restaurant?.let {
                    if (state.partySize >= it.maxPartySize) {
                        Text(stringResource(R.string.reserve_large_party, it.maxPartySize), style = AppTypography.caption)
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.reserve_date), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(state.dates, key = { it.toString() }) { date ->
                        val label = when {
                            date == LocalDate.now() -> stringResource(R.string.reserve_today)
                            date == LocalDate.now().plusDays(1) -> stringResource(R.string.reserve_tomorrow)
                            else -> formatters.dateShort(date)
                        }
                        Chip(label, date == state.date, { viewModel.setDate(date) })
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.reserve_time), style = AppTypography.subtitle)
                if (restaurant != null && DemoAvailability.isClosed(restaurant, state.date)) {
                    Text(stringResource(R.string.reserve_closed_day), style = AppTypography.body)
                } else if (state.slots.none { it.available }) {
                    Text(stringResource(R.string.reserve_no_slots), style = AppTypography.body)
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                        items(state.slots, key = { it.time }) { slot ->
                            Chip(
                                label = formatters.time(slot.time),
                                selected = slot.time == state.time,
                                onClick = { viewModel.setTime(slot.time) },
                                unavailable = !slot.available,
                            )
                        }
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.reserve_seating), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(restaurant?.seating ?: Seating.entries, key = { it.id }) { seating ->
                        Chip(stringResource(seating.label), seating == state.seating, { viewModel.setSeating(seating) }, icon = seating.icon)
                    }
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(stringResource(R.string.reserve_occasion), style = AppTypography.subtitle)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(Occasion.entries, key = { it.id }) { occasion ->
                        Chip(stringResource(occasion.label), occasion == state.occasion, { viewModel.setOccasion(occasion) }, icon = occasion.icon)
                    }
                }
            }
        }
        item {
            AppTextField(
                value = state.notes,
                onValueChange = viewModel::setNotes,
                label = stringResource(R.string.reserve_notes_placeholder),
                singleLine = false,
                minLines = 3,
                supporting = stringResource(R.string.reserve_notes_count, state.notes.length, ReservationValidator.MAX_NOTES_LENGTH),
            )
        }
        state.error?.let { error ->
            item {
                Text(
                    text = if (error == ReservationError.NotesTooLong) {
                        stringResource(error.message, ReservationValidator.MAX_NOTES_LENGTH)
                    } else {
                        stringResource(error.message)
                    },
                    color = app.core.designsystem.AppTheme.colors.error,
                    style = AppTypography.caption,
                )
            }
        }
        item {
            PrimaryButton(
                text = stringResource(if (state.modifying) R.string.reserve_save_changes else R.string.reserve_confirm),
                onClick = { viewModel.submit(onConfirmed) },
                busy = state.submitting,
                modifier = Modifier.fillMaxWidth().testTag("reserve.confirm"),
            )
        }
        item { Text(stringResource(R.string.reserve_policy), style = AppTypography.caption) }
    }
}
