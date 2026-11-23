package app.features.catalog

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import app.R
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing

private val StepperHeight = 40.dp
private val StepperButtonWidth = 40.dp

/**
 * The add control on product cards and cart lines (DESIGN.md: Quantity stepper). At 0, an outlined Add button;
 * from 1, a filled `primary` capsule with − count +. Springs between the two with AnimatedContent.
 * Test IDs use [tagPrefix]: `product.<id>.add`, `.increase`, `.decrease`, `.quantity`.
 */
@Composable
fun QuantityStepper(
    productName: String,
    quantity: Int,
    tagPrefix: String,
    onAdd: () -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AnimatedContent(
        targetState = quantity > 0,
        modifier = modifier,
        contentAlignment = Alignment.CenterEnd,
        transitionSpec = {
            (fadeIn(tween(150)) + scaleIn(spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium), initialScale = 0.8f))
                .togetherWith(fadeOut(tween(100)) + scaleOut(tween(100), targetScale = 0.8f))
        },
        label = "stepper",
    ) { inCart ->
        if (!inCart) {
            AddButton(productName = productName, tag = "$tagPrefix.add", onClick = onAdd)
        } else {
            FilledStepper(productName, quantity, tagPrefix, onAdd, onRemove)
        }
    }
}

@Composable
private fun AddButton(productName: String, tag: String, onClick: () -> Unit) {
    val label = stringResource(R.string.common_add_item, productName)
    Surface(
        onClick = onClick,
        modifier = Modifier
            .height(StepperHeight)
            .widthIn(min = 76.dp)
            .testTag(tag)
            .semantics { contentDescription = label },
        shape = RoundedCornerShape(AppRadius.md),
        color = AppTheme.colors.surface,
        contentColor = AppTheme.colors.primary,
        border = BorderStroke(1.5.dp, AppTheme.colors.primary),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                stringResource(R.string.common_add),
                style = AppTextStyles.labelBold,
                modifier = Modifier.padding(horizontal = AppSpacing.md).clearAndSetSemantics {},
            )
        }
    }
}

@Composable
private fun FilledStepper(productName: String, quantity: Int, tagPrefix: String, onAdd: () -> Unit, onRemove: () -> Unit) {
    val inCart = pluralStringResource(R.plurals.common_in_cart, quantity, quantity)
    Surface(
        modifier = Modifier.height(StepperHeight),
        shape = RoundedCornerShape(AppRadius.md),
        color = AppTheme.colors.primary,
        contentColor = AppTheme.colors.onPrimary,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            StepperButton(
                icon = { Icon(AppIcons.remove, contentDescription = null, modifier = Modifier.size(AppIconSize.sm)) },
                label = stringResource(R.string.common_decrease, productName),
                tag = "$tagPrefix.decrease",
                onClick = onRemove,
            )
            AnimatedContent(
                targetState = quantity,
                transitionSpec = {
                    val up = targetState > initialState
                    (slideInVertically(tween(180)) { if (up) it else -it } + fadeIn(tween(180)))
                        .togetherWith(slideOutVertically(tween(180)) { if (up) -it else it } + fadeOut(tween(120)))
                },
                contentAlignment = Alignment.Center,
                label = "quantity",
            ) { count ->
                Text(
                    count.toString(),
                    style = AppTextStyles.labelBold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .widthIn(min = 20.dp)
                        .testTag("$tagPrefix.quantity")
                        .semantics {
                            contentDescription = inCart
                            liveRegion = LiveRegionMode.Polite
                        },
                )
            }
            StepperButton(
                icon = { Icon(AppIcons.add, contentDescription = null, modifier = Modifier.size(AppIconSize.sm)) },
                label = stringResource(R.string.common_increase, productName),
                tag = "$tagPrefix.increase",
                onClick = onAdd,
            )
        }
    }
}

@Composable
private fun StepperButton(icon: @Composable () -> Unit, label: String, tag: String, onClick: () -> Unit) {
    // Visually 40 dp; Compose extends the touch area of small clickables to the 48 dp minimum.
    Box(
        modifier = Modifier
            .fillMaxHeight()
            .size(width = StepperButtonWidth, height = StepperHeight)
            .testTag(tag)
            .clickable(onClick = onClick, role = Role.Button, onClickLabel = null)
            .semantics {
                contentDescription = label
                role = Role.Button
            },
        contentAlignment = Alignment.Center,
    ) { icon() }
}

@Preview
@Composable
private fun QuantityStepperPreview() {
    AppTheme(darkTheme = false) {
        Column(Modifier.padding(AppSpacing.lg)) {
            QuantityStepper("Robusta Banana", 0, "product.banana", {}, {})
            QuantityStepper("Robusta Banana", 2, "product.banana", {}, {})
        }
    }
}
