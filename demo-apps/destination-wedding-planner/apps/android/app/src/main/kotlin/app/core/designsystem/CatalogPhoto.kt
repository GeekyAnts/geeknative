package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage

/** Remote catalog photograph. A missing image keeps the surfaceVariant field behind the name. */
@Composable
fun CatalogPhoto(
    url: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
) {
    Box(modifier.background(AppTheme.colors.surfaceVariant)) {
        AsyncImage(
            model = url,
            contentDescription = contentDescription,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
    }
}
