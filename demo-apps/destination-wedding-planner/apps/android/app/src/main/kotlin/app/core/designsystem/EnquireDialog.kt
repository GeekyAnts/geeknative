package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import app.R
import app.features.catalog.EnquiryDraft
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun EnquireDialog(
    title: String,
    successMessage: String,
    success: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (EnquiryDraft) -> Unit,
    formTestTag: String,
    submitTestTag: String,
    successTestTag: String,
) {
    var coupleName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var date by rememberSaveable { mutableStateOf("") }
    var guests by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf(false) }
    var submitted by rememberSaveable { mutableStateOf(false) }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(AppTheme.colors.onBackground.copy(alpha = 0.4f)),
        )
        Surface(
            shape = RoundedCornerShape(AppRadius.xl),
            color = AppTheme.colors.surface,
            contentColor = AppTheme.colors.onSurface,
            modifier = Modifier
                .padding(AppSpacing.lg)
                .fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(AppSpacing.xl),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                if (success || submitted) {
                    Text(
                        successMessage,
                        style = AppTypography.body,
                        modifier = Modifier.testTag(successTestTag),
                    )
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.common_close))
                    }
                } else {
                    Text(title, style = AppTypography.headline)
                    Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                        Button(
                            onClick = {
                                val draft = EnquiryDraft(coupleName, email, date, guests, message)
                                if (draft.isValid) {
                                    error = false
                                    submitted = true
                                    onSubmit(draft)
                                } else {
                                    error = true
                                }
                            },
                            modifier = Modifier.testTag(submitTestTag),
                        ) {
                            Text(stringResource(R.string.venues_enquire_submit))
                        }
                        OutlinedButton(onClick = onDismiss) {
                            Text(stringResource(R.string.common_cancel))
                        }
                    }
                    Column(
                        modifier = Modifier
                            .testTag(formTestTag)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    ) {
                        AppTextField(
                            value = coupleName,
                            onValueChange = { coupleName = it },
                            label = stringResource(R.string.venues_enquire_name),
                        )
                        AppTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = stringResource(R.string.venues_enquire_email),
                            keyboardType = KeyboardType.Email,
                        )
                        AppDateField(
                            value = date,
                            onValueChange = { date = it },
                            label = stringResource(R.string.venues_enquire_date),
                        )
                        AppTextField(
                            value = guests,
                            onValueChange = { guests = it },
                            label = stringResource(R.string.venues_enquire_guests),
                            keyboardType = KeyboardType.Number,
                        )
                        AppTextField(
                            value = message,
                            onValueChange = { message = it },
                            label = stringResource(R.string.venues_enquire_message),
                            singleLine = false,
                            modifier = Modifier.heightIn(min = AppSpacing.xxxl + AppSpacing.xxxl),
                        )
                    }
                    if (error) {
                        Text(
                            stringResource(R.string.venues_enquire_error),
                            style = AppTypography.label,
                            color = AppTheme.colors.error,
                        )
                    }
                }
            }
        }
    }
}
