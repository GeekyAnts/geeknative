package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.generated.AppIconSize
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

/** Minimum touch target on Android (DESIGN.md, Accessibility). */
val MinTouchTarget = 48.dp

/** Bold variants of the type roles, for prices and emphasis. */
object AppTextStyles {
    val price = AppTypography.body.copy(fontWeight = FontWeight.Bold)
    val labelBold = AppTypography.label.copy(fontWeight = FontWeight.Bold)
    val captionBold = AppTypography.caption.copy(fontWeight = FontWeight.Bold)
    val titleBold = AppTypography.title.copy(fontWeight = FontWeight.Bold)
}

/** An icon centered in a filled circle (the delivery promise, empty states, the order hero). */
@Composable
fun IconCircle(
    icon: ImageVector,
    background: Color,
    tint: Color,
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    iconSize: Dp = AppIconSize.md,
) {
    Box(
        modifier = modifier.size(size).background(background, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(iconSize))
    }
}

/** Catalog artwork: an emoji centered on its category's tint. Decorative, so hidden from TalkBack. */
@Composable
fun Artwork(emoji: String, tint: Color, modifier: Modifier = Modifier, emojiSize: TextUnit = 48.sp, radius: Dp = AppRadius.lg) {
    Box(
        modifier = modifier.background(tint, RoundedCornerShape(radius)).clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, fontSize = emojiSize, lineHeight = emojiSize)
    }
}

/** A price in `common.price`, followed by the struck-through MRP when it's higher (DESIGN.md, Money). */
@Composable
fun StruckPrice(text: String, description: String, modifier: Modifier = Modifier) {
    Text(
        text,
        style = AppTypography.caption,
        color = AppTheme.colors.onSurfaceVariant,
        textDecoration = TextDecoration.LineThrough,
        modifier = modifier.semantics { contentDescription = description },
    )
}

/** Centered icon in a `surfaceVariant` circle, title, body and an optional primary button (DESIGN.md, Empty state). */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    actionTag: String? = null,
    onAction: () -> Unit = {},
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = AppSpacing.xxl, vertical = AppSpacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        IconCircle(
            icon = icon,
            background = AppTheme.colors.surfaceVariant,
            tint = AppTheme.colors.onSurfaceVariant,
            size = 96.dp,
            iconSize = AppIconSize.lg * 1.5f,
        )
        Spacer(Modifier.height(AppSpacing.xl))
        Text(title, style = AppTypography.title, color = AppTheme.colors.onBackground, textAlign = TextAlign.Center)
        Spacer(Modifier.height(AppSpacing.sm))
        Text(body, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center)
        if (actionLabel != null) {
            Spacer(Modifier.height(AppSpacing.xl))
            PrimaryButton(
                text = actionLabel,
                onClick = onAction,
                modifier = if (actionTag != null) Modifier.testTag(actionTag) else Modifier,
            )
        }
    }
}

/** The primary action: green, rounded, at least 52 high so it reads as the main thing to do. */
@Composable
fun PrimaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.heightIn(min = 52.dp),
        shape = RoundedCornerShape(AppRadius.md),
        colors = ButtonDefaults.buttonColors(
            containerColor = AppTheme.colors.primary,
            contentColor = AppTheme.colors.onPrimary,
            disabledContainerColor = AppTheme.colors.surfaceVariant,
            disabledContentColor = AppTheme.colors.onSurfaceVariant,
        ),
        contentPadding = PaddingValues(horizontal = AppSpacing.xl, vertical = AppSpacing.md),
    ) {
        Text(text, style = AppTextStyles.labelBold)
    }
}

/** A label/value row in a bill or summary. */
@Composable
fun AmountRow(
    label: String,
    modifier: Modifier = Modifier,
    labelStyle: TextStyle = AppTypography.body,
    content: @Composable () -> Unit,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        Text(label, style = labelStyle, color = AppTheme.colors.onSurface, modifier = Modifier.weight(1f))
        content()
    }
}
