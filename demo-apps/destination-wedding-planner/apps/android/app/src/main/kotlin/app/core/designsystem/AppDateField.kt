package app.core.designsystem

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import app.R
import app.features.catalog.formatIsoDate
import app.features.catalog.isoDateFromEpochMillis
import app.features.catalog.isoDateToEpochMillis
import app.generated.AppIcons
import app.generated.AppTypography

/** Native date picker that stores ISO yyyy-MM-dd, matching iOS DatePicker and web type=date. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDateField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
) {
    var open by rememberSaveable { mutableStateOf(false) }
    val pickerState = rememberDatePickerState(initialSelectedDateMillis = isoDateToEpochMillis(value))

    Box(modifier) {
        AppTextField(
            value = formatIsoDate(value),
            onValueChange = {},
            label = label,
            readOnly = true,
            leadingIcon = AppIcons.calendar,
        )
        Box(
            Modifier
                .matchParentSize()
                .clickable(role = Role.Button, onClickLabel = label) { open = true },
        )
    }

    if (open) {
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        pickerState.selectedDateMillis?.let { onValueChange(isoDateFromEpochMillis(it)) }
                        open = false
                    },
                ) {
                    Text(stringResource(R.string.common_done), style = AppTypography.label)
                }
            },
            dismissButton = {
                TextButton(onClick = { open = false }) {
                    Text(stringResource(R.string.common_cancel), style = AppTypography.label)
                }
            },
        ) {
            DatePicker(state = pickerState)
        }
    }
}
