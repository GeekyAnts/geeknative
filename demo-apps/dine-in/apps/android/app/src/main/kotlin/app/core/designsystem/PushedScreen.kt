package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import app.generated.AppSize
import app.generated.AppSpacing

/** Space at the top of a pushed screen's content for the [TopBar] floating over it. */
@Composable
fun topBarClearance(): Dp =
    WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + AppSize.touchTarget + AppSpacing.sm * 2

/**
 * A pushed screen on `background`: a scrolling column of [content] under a [TopBar] that turns to
 * glass with [title] once the content scrolls under it.
 */
@Composable
fun PushedScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    listState: LazyListState = rememberLazyListState(),
    content: LazyListScope.() -> Unit,
) {
    val collapsed by remember(listState) { derivedStateOf { listState.canScrollBackward } }
    GlassLayers(
        modifier = modifier.fillMaxSize().background(AppTheme.colors.background),
        overlay = { TopBar(onBack = onBack, title = title, collapsed = collapsed, modifier = Modifier.align(Alignment.TopCenter)) },
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = AppSpacing.lg,
                end = AppSpacing.lg,
                top = topBarClearance(),
                bottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding() + AppSpacing.xxl,
            ),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            content = content,
        )
    }
}
