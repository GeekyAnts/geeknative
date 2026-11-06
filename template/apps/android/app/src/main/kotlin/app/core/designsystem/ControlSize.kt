package app.core.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import app.generated.AppSpacing
import kotlin.math.roundToInt

/*
 * Sizing Material controls to the size tokens (AppSize), so they match iOS and the web.
 * Material has its own sizes that ignore the tokens:
 * - Button and SegmentedButton have a 40 dp minimum height, tall default padding and a text line
 *   taller than their text, so `heightIn(min = AppSize.x)` still draws them about 44 dp. Give them
 *   `Modifier.height(AppSize.x)` and `contentPadding = ControlContentPadding`, and they are drawn
 *   at exactly the token's height (their touch area stays at Material's 48 dp minimum).
 * - Switch, Checkbox and RadioButton have one built-in size. Draw them with
 *   `Modifier.scaledToHeight(AppSize.x)` and `onCheckedChange = null`, and make the row around
 *   them toggleable (`Modifier.toggleable(...)` with `heightIn(min = AppSize.touchTarget)`), so the
 *   touch area stays at least touchTarget however small the drawing is.
 * - Material components draw their own shadows: set their elevation to 0 under Modifier.shadow.
 */

/** Padding for a Button or SegmentedButton sized with `Modifier.height(AppSize.x)`: Material's default would crowd its text. */
val ControlContentPadding = PaddingValues(horizontal = AppSpacing.lg, vertical = AppSpacing.xs)

/**
 * Draws a fixed-size Material control (Switch, Checkbox, RadioButton) scaled so it is [height]
 * high, and lays it out at that size, so the controls around it line up.
 */
fun Modifier.scaledToHeight(height: Dp): Modifier = layout { measurable, _ ->
    val placeable = measurable.measure(Constraints())
    val scale = height.toPx() / placeable.height
    val width = (placeable.width * scale).roundToInt()
    val scaledHeight = height.roundToPx()
    layout(width, scaledHeight) {
        placeable.placeWithLayer((width - placeable.width) / 2, (scaledHeight - placeable.height) / 2) {
            scaleX = scale
            scaleY = scale
        }
    }
}
