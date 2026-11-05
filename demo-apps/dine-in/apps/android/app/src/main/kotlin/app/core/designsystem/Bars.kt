package app.core.designsystem

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.navigationBars
import app.R
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppMotion
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

/**
 * The bar on pushed screens (DESIGN.md: TopBar): transparent with a glass back button; once
 * [collapsed] (content has scrolled under it) it becomes a glass surface with a serif [title].
 */
@Composable
fun TopBar(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    collapsed: Boolean = false,
    overImage: Boolean = false,
    actions: @Composable RowScope.() -> Unit = {},
) {
    val surfaceAlpha by animateFloatAsState(if (collapsed) 1f else 0f, AppMotion.standard(AppMotion.normal), label = "topBar")
    Box(modifier.fillMaxWidth()) {
        if (surfaceAlpha > 0f) {
            GlassSurface(RectangleShape, Modifier.matchParentSize().alpha(surfaceAlpha), floating = false, strong = true) {}
        }
        Row(
            modifier = Modifier
                .statusBarsPadding()
                .fillMaxWidth()
                .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.sm),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            GlassIconButton(
                icon = AppIcons.back,
                contentDescription = stringResource(R.string.common_back),
                onClick = onBack,
                onImage = overImage && !collapsed,
            )
            Box(Modifier.weight(1f)) {
                androidx.compose.animation.AnimatedVisibility(visible = collapsed && title != null, enter = fadeIn(AppMotion.standard()), exit = fadeOut(AppMotion.standard())) {
                    Text(
                        title.orEmpty(),
                        style = AppSerif.title,
                        color = AppTheme.colors.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            actions()
        }
    }
}

/** Bottom floating glass bar holding a primary action and optional summary (DESIGN.md: StickyActionBar). */
@Composable
fun StickyActionBar(
    modifier: Modifier = Modifier,
    summary: (@Composable () -> Unit)? = null,
    action: @Composable () -> Unit,
) {
    GlassSurface(
        shape = RoundedCornerShape(AppRadius.xl),
        modifier = modifier
            .navigationBarsPadding()
            .padding(AppSpacing.lg)
            .fillMaxWidth(),
    ) {
        Row(
            Modifier.padding(AppSpacing.md).padding(start = AppSpacing.sm),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (summary != null) Box(Modifier.weight(1f)) { summary() }
            action()
        }
    }
}

/** One of the five tabs (spec/navigation.md). */
enum class Tab(val label: Int) {
    Discover(R.string.tab_discover),
    Explore(R.string.tab_explore),
    Reservations(R.string.tab_reservations),
    Saved(R.string.tab_saved),
    Profile(R.string.tab_profile);

    val icon: ImageVector
        @Composable get() = when (this) {
            Discover -> AppIcons.tabDiscover
            Explore -> AppIcons.tabExplore
            Reservations -> AppIcons.tabReservations
            Saved -> AppIcons.tabSaved
            Profile -> AppIcons.tabProfile
        }
}

/** Bottom padding that lets scrollable tab screens clear the floating tab bar (`tabBar + xl`). */
@Composable
fun tabBarClearance(): Dp =
    AppSize.tabBar + AppSpacing.xl + WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

/** DESIGN.md: the tab bar is at most 480 wide, centred. */
private val TabBarMaxWidth = 480.dp

/**
 * Floating glass capsule with five items; the active one sits on an `espresso` pill that moves
 * between items with the snappy spring (DESIGN.md: TabBar).
 */
@Composable
fun TabBar(selected: Tab, onSelect: (Tab) -> Unit, modifier: Modifier = Modifier) {
    val haptics = LocalHapticFeedback.current
    val colors = AppTheme.colors
    Box(modifier.fillMaxWidth().navigationBarsPadding().padding(AppSpacing.lg), contentAlignment = Alignment.Center) {
        GlassSurface(CircleShape, Modifier.widthIn(max = TabBarMaxWidth).fillMaxWidth().height(AppSize.tabBar)) {
            BoxWithConstraints(Modifier.fillMaxSize().padding(AppSpacing.xs)) {
                val itemWidth = maxWidth / Tab.entries.size
                val pillOffset by animateDpAsState(itemWidth * selected.ordinal, AppMotion.snappy(), label = "tabPill")
                Box(
                    Modifier
                        .offset(x = pillOffset)
                        .width(itemWidth)
                        .fillMaxHeight()
                        .background(colors.espresso, CircleShape),
                )
                Row(Modifier.fillMaxSize().selectableGroup()) {
                    Tab.entries.forEach { tab ->
                        val active = tab == selected
                        val content by animateColorAsState(
                            if (active) colors.onEspresso else colors.onSurfaceVariant,
                            AppMotion.snappy(),
                            label = "tabContent",
                        )
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .selectable(selected = active, role = Role.Tab) {
                                    if (!active) haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                                    onSelect(tab)
                                },
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs, Alignment.CenterVertically),
                        ) {
                            Icon(tab.icon, contentDescription = null, tint = content, modifier = Modifier.size(AppIconSize.md))
                            Text(stringResource(tab.label), style = AppTypography.caption, color = content, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}
