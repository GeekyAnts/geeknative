package app.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppMotion
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter
import coil3.request.ImageRequest
import coil3.request.crossfade

/** Whether [RemoteImage] loads photos. Off in tests, which show the skeleton. Provided by AppNavigation. */
val LocalRemoteImagesEnabled = staticCompositionLocalOf { true }

private enum class ImageLoad { Loading, Loaded, Failed }

/**
 * A photo from a URL (DESIGN.md: RemoteImage): a shimmering `surfaceVariant` skeleton while
 * loading, `surfaceVariant` with the `utensils` icon on failure. [contentDescription] is null for
 * decorative images.
 */
@Composable
fun RemoteImage(
    url: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    placeholderColor: Color = AppTheme.colors.surfaceVariant,
) {
    val enabled = LocalRemoteImagesEnabled.current
    var load by remember(url) { mutableStateOf(ImageLoad.Loading) }
    Box(modifier.background(placeholderColor)) {
        if (enabled && url != null) {
            val context = LocalContext.current
            val request = remember(url, context) {
                ImageRequest.Builder(context).data(url).crossfade(AppMotion.normal).build()
            }
            AsyncImage(
                model = request,
                contentDescription = contentDescription,
                contentScale = contentScale,
                modifier = Modifier.fillMaxSize(),
                onState = { state ->
                    load = when (state) {
                        is AsyncImagePainter.State.Success -> ImageLoad.Loaded
                        is AsyncImagePainter.State.Error -> ImageLoad.Failed
                        else -> ImageLoad.Loading
                    }
                },
            )
        }
        when {
            url == null || load == ImageLoad.Failed -> Icon(
                AppIcons.utensils,
                contentDescription = null,
                tint = AppTheme.colors.onSurfaceVariant,
                modifier = Modifier.align(Alignment.Center).size(AppIconSize.lg),
            )
            load == ImageLoad.Loading -> Skeleton(Modifier.matchParentSize(), color = placeholderColor)
            else -> Unit
        }
    }
}

/** A vertical gradient from transparent to `scrim` over the lower 60% of a photo with text on it. */
@Composable
fun BoxScope.PhotoScrim(modifier: Modifier = Modifier, coverage: Float = PHOTO_SCRIM_COVERAGE) {
    val scrim = AppTheme.colors.scrim
    Box(
        modifier
            .matchParentSize()
            .background(Brush.verticalGradient(0f to Color.Transparent, (1f - coverage) to Color.Transparent, 1f to scrim)),
    )
}

/** The share of a photo, from the bottom, that [PhotoScrim] darkens. */
const val PHOTO_SCRIM_COVERAGE = 0.6f

/** `surfaceVariant` block with a slow highlight sweep (DESIGN.md: Skeleton); static with reduced motion. */
@Composable
fun Skeleton(modifier: Modifier = Modifier, color: Color = AppTheme.colors.surfaceVariant) {
    val highlight = AppTheme.colors.surface.copy(alpha = SKELETON_HIGHLIGHT_ALPHA)
    val reduceMotion = rememberReduceMotion()
    val transition = rememberInfiniteTransition(label = "skeleton")
    val sweep by transition.animateFloat(
        initialValue = -1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(tween(AppMotion.page * 2, easing = LinearEasing), RepeatMode.Restart),
        label = "sweep",
    )
    Box(
        modifier.drawWithCache {
            onDrawBehind {
                drawRect(color)
                if (!reduceMotion) {
                    val x = size.width * sweep
                    drawRect(
                        Brush.linearGradient(
                            colors = listOf(Color.Transparent, highlight, Color.Transparent),
                            start = Offset(x - size.width / 2, 0f),
                            end = Offset(x + size.width / 2, size.height),
                        ),
                    )
                }
            }
        },
    )
}

private const val SKELETON_HIGHLIGHT_ALPHA = 0.55f
