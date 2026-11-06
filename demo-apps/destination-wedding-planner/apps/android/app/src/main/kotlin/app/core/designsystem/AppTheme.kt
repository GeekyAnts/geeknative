package app.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Shape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import app.generated.AppColorTokens
import app.generated.AppMaterialTypography
import app.generated.AppShadow
import app.generated.AppShapes
import app.generated.DarkAppColors
import app.generated.LightAppColors
import app.generated.toColorScheme

private val LocalAppColors = staticCompositionLocalOf { LightAppColors }

/** Applies the design tokens: [AppTheme.colors] for token colors, and Material 3 theming for stock components. */
@Composable
fun AppTheme(darkTheme: Boolean, content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkAppColors else LightAppColors
    CompositionLocalProvider(LocalAppColors provides colors) {
        MaterialTheme(
            colorScheme = colors.toColorScheme(dark = darkTheme),
            typography = AppMaterialTypography,
            shapes = AppShapes,
            content = content,
        )
    }
}

object AppTheme {
    /** The current color tokens, light or dark. */
    val colors: AppColorTokens
        @Composable @ReadOnlyComposable get() = LocalAppColors.current
}

/** Draws one of the elevation tokens' shadows (DESIGN.md: Elevation), in the current light or dark colors. */
@Composable
fun Modifier.shadow(shadow: AppShadow, shape: Shape): Modifier {
    val color = shadow.color(AppTheme.colors).copy(alpha = shadow.alpha)
    return shadow(elevation = shadow.elevation, shape = shape, ambientColor = color, spotColor = color)
}
