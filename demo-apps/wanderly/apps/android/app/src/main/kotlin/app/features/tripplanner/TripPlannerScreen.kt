package app.features.tripplanner

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.BudgetBandRow
import app.core.designsystem.CategoryChipRow
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.PrimaryActionButton
import app.core.designsystem.TravelersStepper
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem

@Composable
fun TripPlannerScreen(
    viewModel: TripPlannerViewModel,
    onBack: () -> Unit,
    onGenerated: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(state.generatedTripId) {
        state.generatedTripId?.let { id ->
            viewModel.consumeGenerated()
            onGenerated(id)
        }
    }
    TripPlannerContent(
        state = state,
        onBack = onBack,
        onSelectDestination = viewModel::selectDestination,
        onSelectStart = viewModel::selectStart,
        onSelectEnd = viewModel::selectEnd,
        onTravelers = viewModel::setTravelers,
        onBudget = viewModel::setBudget,
        onInterest = viewModel::toggleInterest,
        onGenerate = viewModel::generate,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripPlannerContent(
    state: TripPlannerUiState,
    onBack: () -> Unit,
    onSelectDestination: (String) -> Unit,
    onSelectStart: (LocalDate) -> Unit,
    onSelectEnd: (LocalDate) -> Unit,
    onTravelers: (Int) -> Unit,
    onBudget: (String) -> Unit,
    onInterest: (String) -> Unit,
    onGenerate: () -> Unit,
) {
    var destinationMenu by remember { mutableStateOf(false) }
    var pickingStart by remember { mutableStateOf(false) }
    var pickingEnd by remember { mutableStateOf(false) }
    val selectedName = state.destinations.firstOrNull { it.id == state.destinationId }?.name
    val dateFormatter = remember { DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.planner_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            AppIcons.back,
                            contentDescription = stringResource(R.string.common_back),
                            modifier = Modifier.size(AppIconSize.md),
                        )
                    }
                },
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
            AppCard {
                Text(stringResource(R.string.planner_destination), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                OutlinedButton(
                    onClick = { destinationMenu = true },
                    modifier = Modifier.fillMaxWidth().testTag("planner.destination"),
                    contentPadding = ControlContentPadding,
                ) {
                    Text(selectedName ?: stringResource(R.string.planner_destination_placeholder))
                }
                DropdownMenu(expanded = destinationMenu, onDismissRequest = { destinationMenu = false }) {
                    state.destinations.forEach { destination ->
                        DropdownMenuItem(
                            text = { Text(destination.name) },
                            onClick = {
                                onSelectDestination(destination.id)
                                destinationMenu = false
                            },
                        )
                    }
                }
                if (state.destinationError) {
                    Text(stringResource(R.string.planner_destination_error), color = AppTheme.colors.error, style = AppTypography.caption)
                }
            }

            AppCard {
                Text(stringResource(R.string.planner_dates), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                OutlinedButton(
                    onClick = { pickingStart = true },
                    modifier = Modifier.fillMaxWidth().testTag("planner.startDate"),
                    contentPadding = ControlContentPadding,
                ) {
                    Text(
                        state.startDate?.format(dateFormatter) ?: stringResource(R.string.planner_start_date),
                    )
                }
                OutlinedButton(
                    onClick = { pickingEnd = true },
                    modifier = Modifier.fillMaxWidth().testTag("planner.endDate"),
                    contentPadding = ControlContentPadding,
                ) {
                    Text(
                        state.endDate?.format(dateFormatter) ?: stringResource(R.string.planner_end_date),
                    )
                }
                if (state.dateError) {
                    Text(
                        stringResource(R.string.planner_date_error),
                        color = AppTheme.colors.error,
                        style = AppTypography.caption,
                        modifier = Modifier.testTag("planner.dateError"),
                    )
                }
                if (state.rangeError) {
                    Text(stringResource(R.string.planner_range_error), color = AppTheme.colors.error, style = AppTypography.caption)
                }
            }

            AppCard {
                TravelersStepper(
                    count = state.travelers,
                    onChange = onTravelers,
                    testTag = "planner.travelers",
                    label = R.string.planner_travelers,
                )
            }

            AppCard {
                Text(stringResource(R.string.planner_budget), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                BudgetBandRow(selected = state.budgetBand, onSelect = onBudget, testTagPrefix = "planner.budget")
            }

            AppCard {
                Text(stringResource(R.string.planner_interests), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                CategoryChipRow(
                    selectedIds = state.interests.toSet(),
                    onSelect = { onInterest(it.id) },
                    testTagPrefix = "planner.interest",
                    modifier = Modifier.fillMaxWidth(),
                    padded = false,
                )
            }

            PrimaryActionButton(
                text = stringResource(R.string.planner_generate),
                onClick = onGenerate,
                testTag = "planner.generate",
            )
        }
    }

    if (pickingStart) {
        PlannerDatePicker(
            onDismiss = { pickingStart = false },
            onConfirm = {
                onSelectStart(it)
                pickingStart = false
            },
        )
    }
    if (pickingEnd) {
        PlannerDatePicker(
            onDismiss = { pickingEnd = false },
            onConfirm = {
                onSelectEnd(it)
                pickingEnd = false
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlannerDatePicker(onDismiss: () -> Unit, onConfirm: (LocalDate) -> Unit) {
    val pickerState = rememberDatePickerState()
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    val millis = pickerState.selectedDateMillis ?: Instant.now().toEpochMilli()
                    onConfirm(Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate())
                },
            ) {
                Text(stringResource(R.string.common_ok))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.common_cancel)) }
        },
    ) {
        DatePicker(state = pickerState)
    }
}

@Preview
@Composable
private fun TripPlannerScreenPreview() {
    AppTheme(darkTheme = false) {
        TripPlannerContent(
            state = TripPlannerUiState(),
            onBack = {},
            onSelectDestination = {},
            onSelectStart = {},
            onSelectEnd = {},
            onTravelers = {},
            onBudget = {},
            onInterest = {},
            onGenerate = {},
        )
    }
}
