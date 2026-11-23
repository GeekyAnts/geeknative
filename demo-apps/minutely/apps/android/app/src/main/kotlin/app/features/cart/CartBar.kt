package app.features.cart

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import app.R
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.core.designsystem.IconCircle
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

/**
 * The floating cart bar for a Scaffold's bottom slot (spec/features/cart.md: Cart bar). It slides up when the cart
 * gets its first item and down when it empties. Keeps showing the last totals while it slides away.
 */
@Composable
fun CartBarHost(summary: CartSummary, onOpenCart: () -> Unit) {
    var shown by remember { mutableStateOf(summary) }
    if (summary.itemCount > 0) shown = summary

    AnimatedVisibility(
        visible = summary.itemCount > 0,
        enter = slideInVertically(tween(280)) { it } + fadeIn(tween(200)),
        exit = slideOutVertically(tween(220)) { it } + fadeOut(tween(160)),
    ) {
        CartBar(summary = shown, onClick = onOpenCart)
    }
}

/** A `primary` bar: cart icon, item count and item total, then View cart. The whole bar opens Cart. */
@Composable
fun CartBar(summary: CartSummary, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(AppRadius.lg)
    Surface(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(start = AppSpacing.lg, end = AppSpacing.lg, bottom = AppSpacing.md, top = AppSpacing.sm)
            .shadow(elevation = 12.dp, shape = shape, ambientColor = AppTheme.colors.primary, spotColor = AppTheme.colors.primary)
            .heightIn(min = 64.dp)
            .testTag("cartBar"),
        shape = shape,
        color = AppTheme.colors.primary,
        contentColor = AppTheme.colors.onPrimary,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        ) {
            IconCircle(
                icon = AppIcons.cart,
                background = AppTheme.colors.onPrimary.copy(alpha = 0.16f),
                tint = AppTheme.colors.onPrimary,
                size = 40.dp,
                iconSize = AppIconSize.md,
            )
            Column(Modifier.weight(1f)) {
                Text(
                    pluralStringResource(R.plurals.common_item_count, summary.itemCount, summary.itemCount),
                    style = AppTypography.caption,
                )
                Text(stringResource(R.string.common_price, summary.itemTotal), style = AppTextStyles.titleBold)
            }
            Text(stringResource(R.string.cart_bar_view_cart), style = AppTextStyles.labelBold)
            Icon(AppIcons.chevronRight, contentDescription = null, modifier = Modifier.size(AppIconSize.md))
        }
    }
}

@Preview
@Composable
private fun CartBarPreview() {
    AppTheme(darkTheme = false) {
        CartBar(summary = CartSummary(itemCount = 3, itemTotal = 126), onClick = {})
    }
}
