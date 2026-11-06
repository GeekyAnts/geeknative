package app.core.designsystem

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import app.generated.AppMotion
import app.generated.AppSpacing

/** Cards and buttons scale to this while pressed (DESIGN.md: Motion). */
const val PRESSED_SCALE = 0.97f

/** Disabled controls and closed or unavailable options are drawn at this opacity. */
const val DISABLED_ALPHA = 0.4f

/** Appearing content is staggered by `duration.fast / 3` per item, for at most this many items. */
private const val MAX_STAGGERED_ITEMS = 6

/**
 * Whether the system's animation scale is off ("Remove animations"). Compose animations already
 * follow it; this covers motion that isn't an animation, like scroll-driven parallax.
 */
@Composable
fun rememberReduceMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
}

/** Scales to [PRESSED_SCALE] with the snappy spring while [interactionSource] is pressed. */
@Composable
fun Modifier.pressScale(interactionSource: InteractionSource): Modifier {
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) PRESSED_SCALE else 1f, AppMotion.snappy(), label = "pressScale")
    return graphicsLayer {
        scaleX = scale
        scaleY = scale
    }
}

/**
 * Fades in while sliding up by `spacing.xl` the first time it is composed (DESIGN.md: Motion),
 * staggered by [index]. Remembered across scrolling, so it plays once per item.
 */
@Composable
fun Modifier.appear(index: Int = 0): Modifier {
    var appeared by rememberSaveable { mutableStateOf(false) }
    val progress = remember { Animatable(if (appeared) 1f else 0f) }
    val distance = with(LocalDensity.current) { AppSpacing.xl.toPx() }
    LaunchedEffect(Unit) {
        if (!appeared) {
            val delay = (AppMotion.fast / 3) * index.coerceIn(0, MAX_STAGGERED_ITEMS - 1)
            progress.animateTo(1f, tween(AppMotion.normal, delayMillis = delay, easing = AppMotion.decelerateEasing))
            appeared = true
        }
    }
    return graphicsLayer {
        alpha = progress.value
        translationY = (1f - progress.value) * distance
    }
}
