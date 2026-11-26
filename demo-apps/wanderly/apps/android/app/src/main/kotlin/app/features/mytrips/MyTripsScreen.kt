package app.features.mytrips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.PhotoMetaCard
import app.core.designsystem.PrimaryActionButton
import app.features.tripplanner.Trip
import app.features.tripplanner.TripSegment
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun MyTripsScreen(
    viewModel: MyTripsViewModel,
    onOpenTrip: (String) -> Unit,
    onPlan: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    MyTripsContent(
        state = state,
        onSelect = viewModel::select,
        onOpenTrip = onOpenTrip,
        onPlan = onPlan,
        onRequestDelete = viewModel::requestDelete,
        onCancelDelete = viewModel::cancelDelete,
        onConfirmDelete = viewModel::confirmDelete,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyTripsContent(
    state: MyTripsUiState,
    onSelect: (TripSegment) -> Unit,
    onOpenTrip: (String) -> Unit,
    onPlan: () -> Unit,
    onRequestDelete: (String) -> Unit,
    onCancelDelete: () -> Unit,
    onConfirmDelete: () -> Unit,
) {
    val dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.trips_title), modifier = Modifier.testTag("trips.title")) },
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
            val segments = TripSegment.entries
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                segments.forEachIndexed { index, segment ->
                    SegmentedButton(
                        selected = state.segment == segment,
                        onClick = { onSelect(segment) },
                        shape = SegmentedButtonDefaults.itemShape(index, segments.size),
                        modifier = Modifier
                            .height(AppSize.touchTarget)
                            .testTag("trips.segment.${segment.id}"), // geeknative-ignore
                        contentPadding = ControlContentPadding,
                        label = { Text(stringResource(segmentLabel(segment)), maxLines = 1, style = AppTypography.label) },
                    )
                }
            }

            if (state.trips.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth().testTag("trips.empty"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    Text(stringResource(emptyTitle(state.segment)), style = AppTypography.title)
                    Text(
                        stringResource(emptyBody(state.segment)),
                        style = AppTypography.body,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                    if (state.segment != TripSegment.Past) {
                        PrimaryActionButton(
                            text = stringResource(R.string.trips_plan),
                            onClick = onPlan,
                            testTag = "trips.plan",
                        )
                    }
                }
            } else {
                state.trips.forEach { trip ->
                    TripCard(
                        trip = trip,
                        imageUrl = state.destinations[trip.destinationId]?.imageUrl.orEmpty(),
                        fallbackUrl = state.fallbackImageUrl,
                        dateFormatter = dateFormatter,
                        onOpen = { onOpenTrip(trip.id) },
                        onDelete = { onRequestDelete(trip.id) },
                    )
                }
            }
        }
    }

    if (state.pendingDeleteId != null) {
        AlertDialog(
            onDismissRequest = onCancelDelete,
            title = { Text(stringResource(R.string.trips_delete_title)) },
            text = { Text(stringResource(R.string.trips_delete_body)) },
            confirmButton = {
                TextButton(onClick = onConfirmDelete) {
                    Text(stringResource(R.string.common_delete), color = AppTheme.colors.error)
                }
            },
            dismissButton = {
                TextButton(onClick = onCancelDelete) { Text(stringResource(R.string.common_cancel)) }
            },
        )
    }
}

@Composable
private fun TripCard(
    trip: Trip,
    imageUrl: String,
    fallbackUrl: String,
    dateFormatter: DateTimeFormatter,
    onOpen: () -> Unit,
    onDelete: () -> Unit,
) {
    PhotoMetaCard(
        imageUrl = imageUrl,
        fallbackUrl = fallbackUrl,
        contentDescription = trip.title,
        modifier = Modifier.testTag("trips.card.${trip.id}"), // geeknative-ignore
        onClick = onOpen,
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Text(trip.title, style = AppTypography.title)
                Text(
                    stringResource(
                        R.string.itinerary_dates,
                        formatIso(trip.startDate, dateFormatter),
                        formatIso(trip.endDate, dateFormatter),
                    ),
                    style = AppTypography.caption,
                    color = AppTheme.colors.onSurfaceVariant,
                )
            }
            IconButton(
                onClick = onDelete,
                modifier = Modifier.size(AppSize.touchTarget).testTag("trips.delete.${trip.id}"), // geeknative-ignore
            ) {
                Icon(
                    AppIcons.trash,
                    contentDescription = stringResource(R.string.trips_delete_title),
                    modifier = Modifier.size(AppIconSize.md),
                )
            }
        }
    }
}

private fun segmentLabel(segment: TripSegment) = when (segment) {
    TripSegment.Upcoming -> R.string.trips_upcoming
    TripSegment.Past -> R.string.trips_past
    TripSegment.Drafts -> R.string.trips_drafts
}

private fun emptyTitle(segment: TripSegment) = when (segment) {
    TripSegment.Upcoming -> R.string.trips_empty_upcoming
    TripSegment.Past -> R.string.trips_empty_past
    TripSegment.Drafts -> R.string.trips_empty_drafts
}

private fun emptyBody(segment: TripSegment) = when (segment) {
    TripSegment.Upcoming -> R.string.trips_empty_upcoming_body
    TripSegment.Past -> R.string.trips_empty_past_body
    TripSegment.Drafts -> R.string.trips_empty_drafts_body
}

private fun formatIso(iso: String, formatter: DateTimeFormatter): String =
    runCatching { LocalDate.parse(iso).format(formatter) }.getOrDefault(iso)

@Preview
@Composable
private fun MyTripsScreenPreview() {
    AppTheme(darkTheme = false) {
        MyTripsContent(
            state = MyTripsUiState(),
            onSelect = {},
            onOpenTrip = {},
            onPlan = {},
            onRequestDelete = {},
            onCancelDelete = {},
            onConfirmDelete = {},
        )
    }
}
