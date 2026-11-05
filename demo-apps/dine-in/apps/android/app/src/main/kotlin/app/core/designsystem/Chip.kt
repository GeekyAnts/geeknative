package app.core.designsystem

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextDecoration
import app.generated.AppIconSize
import app.generated.AppMotion
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

/**
 * Height `size.chip`, full radius, `label` text (DESIGN.md: Chip). Unselected: `surface` with an
 * `accent` hairline at 40%; selected: `espresso` with `onEspresso` text, changing with the snappy spring.
 * [unavailable] strikes the label through at 40% and makes it untappable.
 */
@Composable
fun Chip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    unavailable: Boolean = false,
) {
    val colors = AppTheme.colors
    val container by animateColorAsState(if (selected) colors.espresso else colors.surface, AppMotion.snappy(), label = "chipFill")
    val content by animateColorAsState(if (selected) colors.onEspresso else colors.onSurface, AppMotion.snappy(), label = "chipText")
    val border by animateColorAsState(if (selected) colors.espresso else colors.accent.copy(alpha = 0.4f), AppMotion.snappy(), label = "chipBorder")
    val interaction = remember { MutableInteractionSource() }
    Row(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .height(AppSize.chip)
            .pressScale(interaction)
            .alpha(if (unavailable) DISABLED_ALPHA else 1f)
            .clip(CircleShape)
            .background(container)
            .border(AppSize.hairline, border, CircleShape)
            .toggleable(
                value = selected,
                interactionSource = interaction,
                indication = ripple(),
                enabled = !unavailable,
                role = Role.Checkbox,
                onValueChange = { onClick() },
            )
            .padding(horizontal = AppSpacing.lg),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) Icon(icon, contentDescription = null, tint = content, modifier = Modifier.size(AppIconSize.sm))
        Text(
            label,
            style = AppTypography.label.copy(textDecoration = if (unavailable) TextDecoration.LineThrough else null),
            color = content,
            maxLines = 1,
        )
        if (trailingIcon != null) Icon(trailingIcon, contentDescription = null, tint = content, modifier = Modifier.size(AppIconSize.sm))
    }
}
