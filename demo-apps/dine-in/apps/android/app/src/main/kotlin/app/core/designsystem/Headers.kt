package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import app.R
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

/** `overline` type, uppercase, tracked by `size.tracking`, in `accent` (or `onGlassOnImage` on photos). */
@Composable
fun Overline(text: String, modifier: Modifier = Modifier, color: Color = AppTheme.colors.accent) {
    val tracking = with(LocalDensity.current) { AppSize.tracking.toSp() }
    Text(text.uppercase(), style = AppTypography.overline.copy(letterSpacing = tracking), color = color, modifier = modifier)
}

/** A short gold bar under editorial overlines (DESIGN.md: GoldRule). */
@Composable
fun GoldRule(modifier: Modifier = Modifier) {
    Box(modifier.width(AppSpacing.xxl).height(AppSpacing.xxs).background(AppTheme.colors.accent, CircleShape))
}

/** An [Overline], gold rule and serif `title`, with an optional trailing "See all" link. */
@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    overline: String? = null,
    titleColor: Color = AppTheme.colors.onBackground,
    onSeeAll: (() -> Unit)? = null,
) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
            if (overline != null) Overline(overline)
            GoldRule()
            Text(title, style = AppSerif.title, color = titleColor, modifier = Modifier.semantics { heading() })
        }
        if (onSeeAll != null) TextLinkButton(stringResource(R.string.common_see_all), onClick = onSeeAll)
    }
}

/** In-content, leading-aligned screen title (DESIGN.md: ScreenHeader). */
@Composable
fun ScreenHeader(title: String, modifier: Modifier = Modifier, overline: String? = null, subtitle: String? = null) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
        if (overline != null) Overline(overline)
        GoldRule()
        Text(title, style = AppSerif.display, color = AppTheme.colors.onBackground, modifier = Modifier.semantics { heading() })
        if (subtitle != null) Text(subtitle, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
    }
}
