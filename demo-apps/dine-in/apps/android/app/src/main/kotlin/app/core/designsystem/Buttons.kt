package app.core.designsystem

import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import app.R
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppMotion
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import kotlinx.coroutines.launch

/** The favourite heart grows to this on toggle, then settles back with the bouncy spring. */
private const val FAVOURITE_POP_SCALE = 1.25f

@Composable
private fun PillButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier,
    container: Color,
    content: Color,
    border: Color?,
    enabled: Boolean,
    dimmed: Boolean,
    busy: Boolean,
    icon: ImageVector?,
    height: Dp,
) {
    val interaction = remember { MutableInteractionSource() }
    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .height(height)
            .pressScale(interaction)
            .alpha(if (enabled && !dimmed) 1f else DISABLED_ALPHA)
            .clip(CircleShape)
            .background(container)
            .then(if (border != null) Modifier.border(AppSize.hairline, border, CircleShape) else Modifier)
            .clickable(
                interactionSource = interaction,
                indication = ripple(color = content),
                enabled = enabled && !busy,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { if (busy) contentDescription = text }
            .padding(horizontal = if (height < AppSize.button) AppSpacing.lg else AppSpacing.xl),
        contentAlignment = Alignment.Center,
    ) {
        if (busy) {
            CircularProgressIndicator(color = content, strokeWidth = AppSize.hairline * 2, modifier = Modifier.size(AppIconSize.md))
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) Icon(icon, contentDescription = null, tint = content, modifier = Modifier.size(AppIconSize.sm))
                Text(text, style = AppTypography.label, color = content, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/**
 * Height `size.button`, full radius, `espresso` fill (DESIGN.md: PrimaryButton). [dimmed] draws it
 * at 40% while keeping it tappable (for a Continue that explains what's missing).
 */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    dimmed: Boolean = false,
    busy: Boolean = false,
    icon: ImageVector? = null,
    height: Dp = AppSize.button,
    containerColor: Color = AppTheme.colors.espresso,
    contentColor: Color = AppTheme.colors.onEspresso,
) = PillButton(text, onClick, modifier, containerColor, contentColor, null, enabled, dimmed, busy, icon, height)

/** Same shape as [PrimaryButton], transparent with a hairline border in [color]. */
@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    height: Dp = AppSize.button,
    color: Color = AppTheme.colors.primary,
) = PillButton(text, onClick, modifier, Color.Transparent, color, color, enabled, false, false, icon, height)

/** A text-only button, for links like "Edit" and "Clear all". */
@Composable
fun TextLinkButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, color: Color = AppTheme.colors.primary) {
    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .clip(CircleShape)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(horizontal = AppSpacing.sm),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, style = AppTypography.label, color = color)
    }
}

/**
 * A `touchTarget` circle with an `md` icon: `glassOnImage` on photographs, `glass` on content
 * (DESIGN.md: GlassIconButton). [contentDescription] comes from strings.
 */
@Composable
fun GlassIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onImage: Boolean = true,
    enabled: Boolean = true,
    tint: Color? = null,
) {
    val colors = AppTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val fill = if (onImage) colors.glassOnImage else colors.glass
    Box(
        modifier = modifier
            .size(AppSize.touchTarget)
            .pressScale(interaction)
            .alpha(if (enabled) 1f else DISABLED_ALPHA)
            .clip(CircleShape)
            .background(fill)
            .border(AppSize.hairline, colors.glassBorder, CircleShape)
            .clickable(interactionSource = interaction, indication = ripple(), enabled = enabled, role = Role.Button, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            icon,
            contentDescription = contentDescription,
            tint = tint ?: if (onImage) colors.onGlassOnImage else colors.onSurface,
            modifier = Modifier.size(AppIconSize.md),
        )
    }
}

/**
 * The heart on restaurant cards and the restaurant screen (DESIGN.md: FavouriteButton): `heart` →
 * `heartFilled` in `accent`, popping 1 → 1.25 → 1 on toggle, with a light haptic.
 */
@Composable
fun FavouriteButton(saved: Boolean, onToggle: () -> Unit, restaurantId: String, modifier: Modifier = Modifier, onImage: Boolean = true) {
    val haptics = LocalHapticFeedback.current
    val scale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()
    val colors = AppTheme.colors
    val label = stringResource(if (saved) R.string.restaurant_unsave else R.string.restaurant_save)
    GlassIconButton(
        icon = if (saved) AppIcons.heartFilled else AppIcons.heart,
        contentDescription = label,
        onClick = {
            haptics.performHapticFeedback(if (saved) HapticFeedbackType.ToggleOff else HapticFeedbackType.ToggleOn)
            onToggle()
            scope.launch {
                scale.animateTo(FAVOURITE_POP_SCALE, AppMotion.snappy())
                scale.animateTo(1f, AppMotion.bouncy())
            }
        },
        onImage = onImage,
        tint = if (saved) colors.accent else null,
        modifier = modifier
            .testTag("favourite.$restaurantId")
            .graphicsLayer {
                scaleX = scale.value
                scaleY = scale.value
            },
    )
}
