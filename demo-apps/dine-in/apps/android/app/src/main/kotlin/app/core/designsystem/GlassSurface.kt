package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import app.generated.AppElevation
import app.generated.AppSize
import dev.chrisbanes.haze.HazeInput
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.blur.HazeBlurStyle
import dev.chrisbanes.haze.blur.HazeColorEffect
import dev.chrisbanes.haze.blur.hazeBlur
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState

/** Warm ivory wash behind tab screens (DESIGN.md: Atmosphere). */
@Composable
fun ClubAtmosphere(modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Box(modifier.fillMaxSize().background(colors.background)) {
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(colors.muted.copy(alpha = 0.45f), Color.Transparent),
                        center = Offset(0f, 0f),
                        radius = 900f,
                    ),
                ),
        )
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(colors.accent.copy(alpha = 0.14f), Color.Transparent),
                        center = Offset(1800f, 160f),
                        radius = 720f,
                    ),
                ),
        )
    }
}

/** Whether glass surfaces blur what's behind them (API 31+ with Haze). Provided by AppNavigation. */
val LocalBlurEnabled = staticCompositionLocalOf { false }

/** The content glass surfaces in this subtree blur, when [LocalBlurEnabled]. */
val LocalGlassBackdrop = staticCompositionLocalOf<HazeState?> { null }

/** A backdrop for floating glass, or null when blur is off (glass then uses the opaque `glassStrong`). */
@Composable
fun rememberGlassBackdrop(): HazeState? {
    val state = rememberHazeState()
    return if (LocalBlurEnabled.current) state else null
}

/** Marks the content that glass surfaces provided with [backdrop] blur. */
fun Modifier.glassBackdropSource(backdrop: HazeState?): Modifier = if (backdrop == null) this else hazeSource(backdrop)

/**
 * Lays [content] out as the backdrop and [overlay] (top bars, tab bar, sticky action bars) above
 * it, so the overlay's glass surfaces blur the content when the platform can.
 */
@Composable
fun GlassLayers(
    modifier: Modifier = Modifier,
    overlay: @Composable BoxScope.() -> Unit,
    content: @Composable BoxScope.() -> Unit,
) {
    val backdrop = rememberGlassBackdrop()
    Box(modifier) {
        Box(Modifier.matchParentSize().glassBackdropSource(backdrop)) { content() }
        CompositionLocalProvider(LocalGlassBackdrop provides backdrop) { overlay() }
    }
}

/**
 * Frosted, translucent warm-white surface for things that float (DESIGN.md: GlassSurface): `glass`
 * over a backdrop blur where available, otherwise a solid `glassStrong` fill; `glassBorder`
 * hairline; `high` shadow when [floating].
 */
@Composable
fun GlassSurface(
    shape: Shape,
    modifier: Modifier = Modifier,
    floating: Boolean = true,
    strong: Boolean = false,
    bordered: Boolean = true,
    content: @Composable BoxScope.() -> Unit,
) {
    val colors = AppTheme.colors
    val backdrop = LocalGlassBackdrop.current
    val fill = if (backdrop != null && !strong) colors.glass else colors.glassStrong
    Box(
        modifier = modifier
            .then(if (floating) Modifier.shadow(AppElevation.high, shape) else Modifier)
            .clip(shape)
            .then(if (backdrop != null) Modifier.glassBlur(backdrop, fill, colors.glassStrong) else Modifier.background(fill))
            .then(if (bordered) Modifier.border(AppSize.hairline, colors.glassBorder, shape) else Modifier),
        content = content,
    )
}

@Composable
private fun Modifier.glassBlur(backdrop: HazeState, tint: Color, fallback: Color): Modifier {
    val style = remember(tint, fallback) {
        HazeBlurStyle {
            blurRadius(AppSize.blur)
            colorEffects(listOf(HazeColorEffect.tint(tint)))
            fallbackColorEffect(HazeColorEffect.tint(fallback))
        }
    }
    return hazeBlur(HazeInput.Sources(backdrop), style)
}
