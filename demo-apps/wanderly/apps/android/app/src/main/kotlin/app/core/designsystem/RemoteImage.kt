package app.core.designsystem

import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import app.generated.AppMotion
import coil.compose.AsyncImage
import coil.request.ImageRequest

/** When true, [RemoteImage] draws only the placeholder — used by previews and UI tests. */
val LocalSkipRemoteImages = staticCompositionLocalOf { false }

/**
 * Catalog photograph: surfaceVariant placeholder, then the URL, then [fallbackUrl], then placeholder.
 */
@Composable
fun RemoteImage(
    url: String,
    fallbackUrl: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
) {
    val skip = LocalSkipRemoteImages.current || LocalInspectionMode.current
    Box(modifier.background(AppTheme.colors.surfaceVariant)) {
        if (skip) return
        var phase by remember(url, fallbackUrl) { mutableIntStateOf(0) }
        val data = when (phase) {
            0 -> url.takeIf { it.isNotBlank() }
            1 -> fallbackUrl.takeIf { it.isNotBlank() && it != url }
            else -> null
        }
        if (data != null) {
            val context = LocalContext.current
            val durationScale = remember(context) {
                Settings.Global.getFloat(
                    context.contentResolver,
                    Settings.Global.ANIMATOR_DURATION_SCALE,
                    1f,
                )
            }
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(data)
                    .crossfade(if (durationScale == 0f) 0 else AppMotion.normal)
                    .build(),
                contentDescription = contentDescription,
                contentScale = contentScale,
                modifier = Modifier.fillMaxSize(),
                onError = {
                    phase = when {
                        phase == 0 && fallbackUrl.isNotBlank() && fallbackUrl != url -> 1
                        else -> 2
                    }
                },
            )
        }
    }
}
