package app.features.itinerary

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.OverlayBackButton
import app.core.designsystem.PhotoHero
import app.core.designsystem.PhotoMetaCard
import app.core.designsystem.PrimaryActionButton
import app.core.designsystem.RemoteImage
import app.features.catalog.Place
import app.features.tripplanner.TripDay
import app.features.tripplanner.TripItem
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun ItineraryScreen(
    viewModel: ItineraryViewModel,
    onBack: () -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ItineraryContent(
        state = state,
        onBack = onBack,
        onOpenPlace = onOpenPlace,
        onOpenAdd = viewModel::openAdd,
        onDismissAdd = viewModel::dismissAdd,
        onAddPlace = viewModel::addPlace,
        onRemove = viewModel::remove,
        onMove = viewModel::move,
        onToggleComplete = viewModel::toggleComplete,
        onSaveTrip = viewModel::saveTrip,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItineraryContent(
    state: ItineraryUiState,
    onBack: () -> Unit,
    onOpenPlace: (String) -> Unit,
    onOpenAdd: (Int) -> Unit,
    onDismissAdd: () -> Unit,
    onAddPlace: (Place) -> Unit,
    onRemove: (String) -> Unit,
    onMove: (String, Int) -> Unit,
    onToggleComplete: (String) -> Unit,
    onSaveTrip: () -> Unit,
) {
    val trip = state.trip
    val destination = state.destination
    val dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)
    Box(Modifier.fillMaxSize()) {
        if (trip == null || destination == null) {
            OverlayBackButton(stringResource(R.string.common_back), onBack, Modifier.statusBarsPadding().padding(AppSpacing.sm))
            return
        }
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            Box(Modifier.testTag("itinerary.hero")) {
                PhotoHero(
                    imageUrl = destination.imageUrl,
                    fallbackUrl = state.fallbackImageUrl,
                    contentDescription = destination.name,
                    height = AppSize.hero,
                ) {
                    Column(
                        modifier = Modifier.align(Alignment.BottomStart).padding(AppSpacing.lg),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                    ) {
                        Text(trip.title, style = AppTypography.display, color = AppTheme.colors.onOverlay)
                        Text(
                            stringResource(
                                R.string.itinerary_dates,
                                formatIso(trip.startDate, dateFormatter),
                                formatIso(trip.endDate, dateFormatter),
                            ),
                            style = AppTypography.label,
                            color = AppTheme.colors.onOverlay,
                        )
                        Text(
                            AppPlurals.itineraryTravelers(trip.travelers),
                            style = AppTypography.label,
                            color = AppTheme.colors.onOverlay,
                        )
                    }
                }
            }

            state.budget?.let { budget ->
                AppCard(modifier = Modifier.padding(horizontal = AppSpacing.lg).testTag("itinerary.budget")) {
                    Text(stringResource(R.string.itinerary_budget_title), style = AppTypography.title)
                    BudgetLine(stringResource(R.string.itinerary_budget_lodging), budget.symbol, budget.lodging)
                    BudgetLine(stringResource(R.string.itinerary_budget_food), budget.symbol, budget.food)
                    BudgetLine(stringResource(R.string.itinerary_budget_activities), budget.symbol, budget.activities)
                    BudgetLine(stringResource(R.string.itinerary_budget_total), budget.symbol, budget.total)
                }
            }

            trip.days.forEach { day ->
                DaySection(
                    day = day,
                    placesById = state.placesById,
                    fallbackUrl = state.fallbackImageUrl,
                    dateFormatter = dateFormatter,
                    onOpenPlace = onOpenPlace,
                    onOpenAdd = { onOpenAdd(day.dayIndex) },
                    onRemove = onRemove,
                    onMove = onMove,
                    onToggleComplete = onToggleComplete,
                )
            }

            PrimaryActionButton(
                text = stringResource(R.string.itinerary_save_trip),
                onClick = onSaveTrip,
                testTag = "itinerary.saveTrip",
                modifier = Modifier.padding(horizontal = AppSpacing.lg).padding(bottom = AppSpacing.xl),
            )
        }
        OverlayBackButton(
            contentDescription = stringResource(R.string.common_back),
            onClick = onBack,
            modifier = Modifier.statusBarsPadding().padding(AppSpacing.sm),
        )
    }

    if (state.addDayIndex != null) {
        ModalBottomSheet(onDismissRequest = onDismissAdd) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(stringResource(R.string.itinerary_add_place_title), style = AppTypography.title)
                state.addablePlaces.forEach { place ->
                    TextButton(onClick = { onAddPlace(place) }, modifier = Modifier.fillMaxWidth()) {
                        Text(place.name)
                    }
                }
            }
        }
    }
}

@Composable
private fun BudgetLine(label: String, symbol: String, amount: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = AppTypography.body)
        Text(stringResource(R.string.itinerary_budget_amount, symbol, amount.toString()), style = AppTypography.body)
    }
}

@Composable
private fun DaySection(
    day: TripDay,
    placesById: Map<String, Place>,
    fallbackUrl: String,
    dateFormatter: DateTimeFormatter,
    onOpenPlace: (String) -> Unit,
    onOpenAdd: () -> Unit,
    onRemove: (String) -> Unit,
    onMove: (String, Int) -> Unit,
    onToggleComplete: (String) -> Unit,
) {
    Column(
        modifier = Modifier.testTag("itinerary.day.${day.dayIndex}"), // geeknative-ignore
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        Column(Modifier.padding(horizontal = AppSpacing.lg)) {
            Text(stringResource(R.string.itinerary_day_title, day.dayIndex.toString()), style = AppTypography.headline)
            Text(formatIso(day.date, dateFormatter), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
        }
        if (day.items.isEmpty()) {
            Text(
                stringResource(R.string.itinerary_empty_day),
                style = AppTypography.body,
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
                color = AppTheme.colors.onSurfaceVariant,
            )
        } else {
            Column(
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                day.items.forEachIndexed { index, item ->
                    ItineraryItemCard(
                        item = item,
                        place = placesById[item.placeId],
                        fallbackUrl = fallbackUrl,
                        isFirst = index == 0,
                        isLast = index == day.items.lastIndex,
                        onOpenPlace = onOpenPlace,
                        onRemove = onRemove,
                        onMove = onMove,
                        onToggleComplete = onToggleComplete,
                    )
                }
            }
        }
        TextButton(
            onClick = onOpenAdd,
            modifier = Modifier.padding(horizontal = AppSpacing.lg).testTag("itinerary.add.${day.dayIndex}"), // geeknative-ignore
        ) {
            Text(stringResource(R.string.itinerary_add))
        }
    }
}

@Composable
private fun ItineraryItemCard(
    item: TripItem,
    place: Place?,
    fallbackUrl: String,
    isFirst: Boolean,
    isLast: Boolean,
    onOpenPlace: (String) -> Unit,
    onRemove: (String) -> Unit,
    onMove: (String, Int) -> Unit,
    onToggleComplete: (String) -> Unit,
) {
    val textColor = if (item.completed) AppTheme.colors.onSurfaceVariant else AppTheme.colors.onSurface
    Column(Modifier.testTag("itinerary.item.${item.id}")) { // geeknative-ignore
        PhotoMetaCard(
            imageUrl = place?.imageUrl.orEmpty(),
            fallbackUrl = fallbackUrl,
            contentDescription = place?.name,
            onClick = { onOpenPlace(item.placeId) },
        ) {
            Text(place?.name.orEmpty(), style = AppTypography.title, color = textColor)
            val duration = if (item.durationMinutes > 0) {
                stringResource(R.string.itinerary_time_duration, item.startTime, item.durationMinutes.toString())
            } else {
                item.startTime
            }
            Text(duration, style = AppTypography.caption, color = textColor)
            place?.summary?.takeIf { it.isNotBlank() }?.let {
                Text(it, style = AppTypography.body, color = textColor)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { onToggleComplete(item.id) },
                    modifier = Modifier.size(app.generated.AppSize.touchTarget).testTag("itinerary.complete.${item.id}"), // geeknative-ignore
                ) {
                    Icon(
                        if (item.completed) AppIcons.checkCircle else AppIcons.check,
                        contentDescription = stringResource(
                            if (item.completed) R.string.itinerary_incomplete else R.string.itinerary_complete,
                        ),
                        modifier = Modifier.size(AppIconSize.md),
                        tint = if (item.completed) AppTheme.colors.primary else AppTheme.colors.onSurfaceVariant,
                    )
                }
                IconButton(
                    onClick = { onMove(item.id, -1) },
                    enabled = !isFirst,
                    modifier = Modifier.size(app.generated.AppSize.touchTarget).testTag("itinerary.moveUp.${item.id}"), // geeknative-ignore
                ) {
                    Icon(
                        AppIcons.chevronUp,
                        contentDescription = stringResource(R.string.itinerary_move_up),
                        modifier = Modifier.size(AppIconSize.md),
                    )
                }
                IconButton(
                    onClick = { onMove(item.id, 1) },
                    enabled = !isLast,
                    modifier = Modifier.size(app.generated.AppSize.touchTarget).testTag("itinerary.moveDown.${item.id}"), // geeknative-ignore
                ) {
                    Icon(
                        AppIcons.chevronDown,
                        contentDescription = stringResource(R.string.itinerary_move_down),
                        modifier = Modifier.size(AppIconSize.md),
                    )
                }
                IconButton(
                    onClick = { onRemove(item.id) },
                    modifier = Modifier.size(app.generated.AppSize.touchTarget).testTag("itinerary.remove.${item.id}"), // geeknative-ignore
                ) {
                    Icon(
                        AppIcons.trash,
                        contentDescription = stringResource(R.string.itinerary_remove),
                        modifier = Modifier.size(AppIconSize.md),
                    )
                }
            }
        }
    }
}

private fun formatIso(iso: String, formatter: DateTimeFormatter): String =
    runCatching { LocalDate.parse(iso).format(formatter) }.getOrDefault(iso)

@Preview
@Composable
private fun ItineraryScreenPreview() {
    AppTheme(darkTheme = false) {
        ItineraryContent(
            state = ItineraryUiState(),
            onBack = {},
            onOpenPlace = {},
            onOpenAdd = {},
            onDismissAdd = {},
            onAddPlace = {},
            onRemove = {},
            onMove = { _, _ -> },
            onToggleComplete = {},
            onSaveTrip = {},
        )
    }
}
