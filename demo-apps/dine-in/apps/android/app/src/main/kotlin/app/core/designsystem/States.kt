package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import app.R
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

/** Centered icon in a `surfaceVariant` circle, serif title, body and an optional action. */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    actionModifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(horizontal = AppSpacing.xl, vertical = AppSpacing.xxxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        Box(
            Modifier.size(AppSize.thumbnail).background(AppTheme.colors.surfaceVariant, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = AppTheme.colors.accent, modifier = Modifier.size(AppIconSize.xl))
        }
        Spacer(Modifier.height(AppSpacing.xs))
        Text(title, style = AppSerif.title, color = AppTheme.colors.onBackground, textAlign = TextAlign.Center)
        Text(body, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center)
        if (actionLabel != null && onAction != null) {
            Spacer(Modifier.height(AppSpacing.sm))
            PrimaryButton(actionLabel, onClick = onAction, modifier = actionModifier)
        }
    }
}

/** [EmptyState] with the `alert` icon and a retry button. */
@Composable
fun ErrorState(onRetry: () -> Unit, modifier: Modifier = Modifier) {
    EmptyState(
        icon = AppIcons.alert,
        title = stringResource(R.string.common_error_title),
        body = stringResource(R.string.common_error_body),
        actionLabel = stringResource(R.string.common_retry),
        onAction = onRetry,
        modifier = modifier,
    )
}

/** The demonstration-data note, so demo availability is never presented as live. */
@Composable
fun DemoNote(modifier: Modifier = Modifier, text: String = stringResource(R.string.common_demo_availability_note)) {
    val colors = AppTheme.colors
    Row(
        modifier = modifier
            .testTag("demoNote")
            .fillMaxWidth()
            .background(colors.surfaceVariant, RoundedCornerShape(AppRadius.md))
            .padding(AppSpacing.md),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(AppIcons.info, contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(AppIconSize.sm))
        Text(text, style = AppTypography.caption, color = colors.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(
            stringResource(R.string.common_demo_badge).uppercase(),
            style = AppTypography.overline,
            color = colors.onAccent,
            modifier = Modifier
                .background(colors.accent, CircleShape)
                .padding(horizontal = AppSpacing.sm, vertical = AppSpacing.xxs),
        )
    }
}
