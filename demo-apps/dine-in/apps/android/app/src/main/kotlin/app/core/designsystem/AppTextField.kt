package app.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.VisualTransformation
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

/**
 * Height `size.button`, radius `md`, `surface` fill, `outline` hairline, `primary` when focused,
 * `error` with a caption message when invalid (DESIGN.md: Text field).
 */
@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    leadingIcon: ImageVector? = null,
    trailing: (@Composable () -> Unit)? = null,
    error: String? = null,
    supporting: String? = null,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    minLines: Int = 1,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val colors = AppTheme.colors
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = modifier.fillMaxWidth().heightIn(min = AppSize.button),
            enabled = enabled,
            singleLine = singleLine,
            minLines = minLines,
            textStyle = AppTypography.body,
            placeholder = { Text(label, style = AppTypography.body, color = colors.onSurfaceVariant) },
            leadingIcon = leadingIcon?.let { { Icon(it, contentDescription = null, tint = colors.onSurfaceVariant) } },
            trailingIcon = trailing,
            isError = error != null,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            visualTransformation = visualTransformation,
            shape = RoundedCornerShape(AppRadius.md),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = colors.surface,
                unfocusedContainerColor = colors.surface,
                disabledContainerColor = colors.surface,
                errorContainerColor = colors.surface,
                focusedBorderColor = colors.primary,
                unfocusedBorderColor = colors.outline,
                errorBorderColor = colors.error,
                cursorColor = colors.primary,
                focusedTextColor = colors.onSurface,
                unfocusedTextColor = colors.onSurface,
            ),
        )
        when {
            error != null -> Text(error, style = AppTypography.caption, color = colors.error)
            supporting != null -> Text(supporting, style = AppTypography.caption, color = colors.onSurfaceVariant)
        }
    }
}
