package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import app.generated.AppElevation
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun PhotoScrim(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, AppTheme.colors.overlay),
                ),
            ),
    )
}

@Composable
fun PhotoHero(
    imageUrl: String,
    fallbackUrl: String,
    contentDescription: String?,
    height: Dp,
    modifier: Modifier = Modifier,
    overlay: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(AppRadius.xl)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .shadow(AppElevation.low, shape)
            .clip(shape),
    ) {
        RemoteImage(
            url = imageUrl,
            fallbackUrl = fallbackUrl,
            contentDescription = contentDescription,
            modifier = Modifier.fillMaxSize(),
        )
        PhotoScrim(Modifier.align(Alignment.BottomCenter).height(height / 2))
        overlay()
    }
}

@Composable
fun OverlayPhotoCard(
    imageUrl: String,
    fallbackUrl: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    height: Dp = AppSize.cardImage,
    onClick: (() -> Unit)? = null,
    overlay: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(AppRadius.xl)
    Box(
        modifier = modifier
            .height(height)
            .shadow(AppElevation.low, shape)
            .clip(shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        RemoteImage(
            url = imageUrl,
            fallbackUrl = fallbackUrl,
            contentDescription = contentDescription,
            modifier = Modifier.fillMaxSize(),
        )
        PhotoScrim(Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(height / 2))
        Box(Modifier.align(Alignment.BottomStart).padding(AppSpacing.md), content = overlay)
    }
}

@Composable
fun PhotoMetaCard(
    imageUrl: String,
    fallbackUrl: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(AppRadius.xl)
    Column(
        modifier = modifier
            .shadow(AppElevation.low, shape)
            .clip(shape)
            .background(AppTheme.colors.surface)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        RemoteImage(
            url = imageUrl,
            fallbackUrl = fallbackUrl,
            contentDescription = contentDescription,
            modifier = Modifier.fillMaxWidth().height(AppSize.cardImage),
        )
        Column(
            modifier = Modifier.padding(AppSpacing.md),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
            content = content,
        )
    }
}

@Composable
fun SaveHeartButton(
    saved: Boolean,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onPhoto: Boolean = false,
) {
    val tint = when {
        saved -> AppTheme.colors.accent
        onPhoto -> AppTheme.colors.onOverlay
        else -> AppTheme.colors.onSurfaceVariant
    }
    IconButton(
        onClick = onClick,
        modifier = modifier.size(AppSize.touchTarget),
        colors = IconButtonDefaults.iconButtonColors(contentColor = tint),
    ) {
        Icon(AppIcons.saved, contentDescription = contentDescription, modifier = Modifier.size(AppIconSize.md))
    }
}

@Composable
fun OverlayBackButton(contentDescription: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(AppSize.touchTarget)
            .background(AppTheme.colors.overlay, CircleShape),
        colors = IconButtonDefaults.iconButtonColors(contentColor = AppTheme.colors.onOverlay),
    ) {
        Icon(AppIcons.back, contentDescription = contentDescription, modifier = Modifier.size(AppIconSize.md))
    }
}

@Composable
fun SectionHeader(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        style = AppTypography.headline,
        color = AppTheme.colors.onBackground,
        modifier = modifier.padding(horizontal = AppSpacing.lg),
    )
}

@Composable
fun RatingRow(rating: String, modifier: Modifier = Modifier, color: Color = AppTheme.colors.onSurfaceVariant) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
    ) {
        Icon(AppIcons.star, contentDescription = null, modifier = Modifier.size(AppIconSize.sm), tint = AppTheme.colors.accent)
        Text(rating, style = AppTypography.caption, color = color)
    }
}
