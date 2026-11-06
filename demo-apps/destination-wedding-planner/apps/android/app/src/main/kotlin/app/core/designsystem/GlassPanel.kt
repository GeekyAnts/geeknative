package app.core.designsystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.generated.AppRadius
import app.generated.AppSpacing

/** Frosted panel over photography: translucent surface, outline, large radius (DESIGN.md). */
@Composable
fun GlassPanel(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(AppRadius.xl),
        color = AppTheme.colors.surface.copy(alpha = 0.82f),
        contentColor = AppTheme.colors.onSurface,
        border = BorderStroke(1.dp, AppTheme.colors.outline),
    ) {
        Column(modifier = Modifier.padding(AppSpacing.lg), content = content)
    }
}
