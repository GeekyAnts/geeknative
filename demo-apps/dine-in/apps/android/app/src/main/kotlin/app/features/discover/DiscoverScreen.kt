package app.features.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.snapping.rememberSnapFlingBehavior
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.Chip
import app.core.designsystem.CollectionCard
import app.core.designsystem.ClubAtmosphere
import app.core.designsystem.DemoNote
import app.core.designsystem.ErrorState
import app.core.designsystem.GlassIconButton
import app.core.designsystem.GlassSurface
import app.core.designsystem.GoldRule
import app.core.designsystem.Overline
import app.core.designsystem.PhotoScrim
import app.core.designsystem.RemoteImage
import app.core.designsystem.RestaurantCard
import app.core.designsystem.SecondaryButton
import app.core.designsystem.SectionHeader
import app.core.designsystem.Skeleton
import app.core.designsystem.appear
import app.core.designsystem.pressScale
import app.core.designsystem.rememberReduceMotion
import app.core.designsystem.tabBarClearance
import app.features.catalog.CuisineId
import app.features.catalog.Restaurant
import app.features.catalog.rememberFormatters
import app.features.explore.ExploreRequest
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import androidx.compose.foundation.interaction.MutableInteractionSource

/** The spotlight's body shows this share of the about text, as the first sentences. */
private const val SPOTLIGHT_SENTENCES = 2
private const val SPOTLIGHT_BODY_ALPHA = 0.8f
private const val SPOTLIGHT_PHOTO_ASPECT = 4f / 3f

data class DiscoverActions(
    val onOpenNotifications: () -> Unit = {},
    val onOpenProfile: () -> Unit = {},
    val onOpenExplore: (ExploreRequest) -> Unit = {},
    val onOpenRestaurant: (String) -> Unit = {},
    val onOpenReservation: (String) -> Unit = {},
    val onToggleSaved: (String) -> Unit = {},
    val onRetry: () -> Unit = {},
)

@Composable
fun DiscoverScreen(viewModel: DiscoverViewModel, actions: DiscoverActions, listState: LazyListState = rememberLazyListState()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    DiscoverContent(
        state = state,
        actions = actions.copy(onToggleSaved = viewModel::toggleSaved, onRetry = viewModel::retry),
        listState = listState,
    )
}

@Composable
fun DiscoverContent(state: DiscoverUiState, actions: DiscoverActions, listState: LazyListState = rememberLazyListState()) {
    Box(Modifier.fillMaxSize()) {
        ClubAtmosphere()
        when (state) {
            DiscoverUiState.Loading -> DiscoverSkeleton()
            DiscoverUiState.Failed -> ErrorState(onRetry = actions.onRetry, modifier = Modifier.statusBarsPadding())
            is DiscoverUiState.Loaded -> DiscoverLoaded(state.content, actions, listState)
        }
    }
}

@Composable
private fun DiscoverLoaded(content: DiscoverContentState, actions: DiscoverActions, listState: LazyListState) {
    val formatters = rememberFormatters()
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = tabBarClearance()),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.xxl),
    ) {
        item(key = "greeting") { GreetingBar(content, actions, Modifier.appear(0)) }
        item(key = "hero") { Hero(content.catalog.heroImage, listState, actions, Modifier.appear(1)) }
        content.upcoming?.let { reservation ->
            val restaurant = content.catalog.restaurant(reservation.restaurantId)
            if (restaurant != null) {
                item(key = "upcoming") {
                    Column(Modifier.padding(horizontal = AppSpacing.lg).appear(2), verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                        Overline(stringResource(R.string.discover_upcoming_overline))
                        UpcomingCard(
                            restaurant = restaurant,
                            whenText = formatters.separator(formatters.dateShort(reservation.date), formatters.time(reservation.time)),
                            party = AppPlurals.reserveGuestCount(reservation.partySize),
                            onClick = { actions.onOpenReservation(reservation.id) },
                        )
                    }
                }
            }
        }
        item(key = "cuisines") {
            Column(Modifier.appear(3), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(
                    title = stringResource(R.string.discover_cuisines_title),
                    overline = stringResource(R.string.discover_cuisines_overline),
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                )
                LazyRow(contentPadding = PaddingValues(horizontal = AppSpacing.lg), horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    items(content.catalog.cuisines, key = { it.id }) { cuisine ->
                        Chip(
                            label = stringResource(cuisine.label),
                            selected = false,
                            onClick = { actions.onOpenExplore(ExploreRequest(cuisine = cuisine)) },
                            modifier = Modifier.testTag("discover.cuisine.${cuisine.id}"),
                        )
                    }
                }
            }
        }
        item(key = "collections") {
            Column(Modifier.appear(4), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(
                    title = stringResource(R.string.discover_collections_title),
                    overline = stringResource(R.string.discover_collections_overline),
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                )
                val rowState = rememberLazyListState()
                LazyRow(
                    state = rowState,
                    flingBehavior = rememberSnapFlingBehavior(rowState),
                    contentPadding = PaddingValues(horizontal = AppSpacing.lg),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    items(content.catalog.collections, key = { it.id.id }) { collection ->
                        CollectionCard(
                            collection = collection,
                            onClick = { actions.onOpenExplore(ExploreRequest(collection = collection.id)) },
                            modifier = Modifier.testTag("discover.collection.${collection.id.id}"),
                        )
                    }
                }
            }
        }
        content.spotlight?.let { restaurant ->
            item(key = "spotlight") { Spotlight(restaurant, onOpen = { actions.onOpenRestaurant(restaurant.id) }, modifier = Modifier.appear(5)) }
        }
        if (content.recommended.isNotEmpty()) {
            item(key = "recommended") {
                RestaurantCarousel(
                    overline = stringResource(R.string.discover_recommended_overline),
                    title = stringResource(R.string.discover_recommended_title),
                    restaurants = content.recommended,
                    content = content,
                    actions = actions,
                    testTagPrefix = "discover.recommended",
                    modifier = Modifier.appear(5),
                )
            }
        }
        item(key = "featured") {
            RestaurantCarousel(
                overline = stringResource(R.string.discover_featured_overline),
                title = stringResource(R.string.discover_featured_title),
                restaurants = content.featured,
                content = content,
                actions = actions,
                testTagPrefix = "discover.featured",
                onSeeAll = { actions.onOpenExplore(ExploreRequest()) },
                modifier = Modifier.appear(5),
            )
        }
        item(key = "demoNote") { DemoNote(Modifier.padding(horizontal = AppSpacing.lg)) }
    }
}

@Composable
private fun GreetingBar(content: DiscoverContentState, actions: DiscoverActions, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Row(
        modifier
            .statusBarsPadding()
            .padding(start = AppSpacing.lg, end = AppSpacing.lg, top = AppSpacing.md),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
            Overline(stringResource(R.string.brand_tagline))
            Text(
                stringResource(R.string.discover_greeting_name, stringResource(content.greeting.label), content.firstName),
                style = AppSerif.title,
                color = colors.onBackground,
                modifier = Modifier.testTag("discover.greeting"),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs), verticalAlignment = Alignment.CenterVertically) {
                Icon(AppIcons.location, contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(AppIconSize.xs))
                Text(stringResource(R.string.discover_location), style = AppTypography.caption, color = colors.onSurfaceVariant)
            }
        }
        Box {
            GlassIconButton(
                icon = AppIcons.bell,
                contentDescription = stringResource(R.string.discover_notifications),
                onClick = actions.onOpenNotifications,
                onImage = false,
                modifier = Modifier.testTag("discover.notifications"),
            )
            if (content.hasReminders) {
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = -AppSpacing.sm, y = AppSpacing.sm)
                        .size(AppSpacing.sm)
                        .background(colors.accent, CircleShape),
                )
            }
        }
        val label = stringResource(R.string.discover_open_profile)
        Box(
            Modifier
                .size(AppSize.touchTarget)
                .clip(CircleShape)
                .clickable(role = Role.Button, onClick = actions.onOpenProfile)
                .semantics { contentDescription = label }
                .testTag("discover.avatar"),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier
                    .size(AppSize.avatar)
                    .background(colors.espresso, CircleShape)
                    .border(AppSize.hairline * 2, colors.accent.copy(alpha = 0.7f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(content.initials, style = AppTypography.label, color = colors.onEspresso)
            }
        }
    }
}

@Composable
private fun Hero(image: String, listState: LazyListState, actions: DiscoverActions, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    val reduceMotion = rememberReduceMotion()
    Box(modifier.fillMaxWidth().padding(horizontal = AppSpacing.lg)) {
        Box(
            Modifier
                .padding(bottom = AppSize.button / 2)
                .fillMaxWidth()
                .height(AppSize.heroHeight)
                .clip(RoundedCornerShape(AppRadius.xl)),
        ) {
            RemoteImage(
                url = image,
                contentDescription = null,
                modifier = Modifier.fillMaxSize().graphicsLayer {
                    alpha = 0.6f
                    if (!reduceMotion) {
                        val offset = listState.layoutInfo.visibleItemsInfo.firstOrNull { it.key == "hero" }?.offset ?: 0
                        translationY = (-offset).coerceAtLeast(0) / 2f
                    }
                },
            )
            Box(Modifier.fillMaxSize().background(colors.espresso.copy(alpha = 0.5f)))
            PhotoScrim()
            Column(
                Modifier.align(Alignment.BottomStart).padding(AppSpacing.xl).padding(bottom = AppSize.button / 2),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            ) {
                Overline(stringResource(R.string.discover_hero_overline), color = colors.onGlassOnImage)
                GoldRule()
                Text(stringResource(R.string.discover_hero_title), style = AppSerif.hero, color = colors.onGlassOnImage)
                Text(stringResource(R.string.discover_hero_body), style = AppTypography.body, color = colors.onGlassOnImage)
                Spacer(Modifier.height(AppSpacing.xs))
                HeroButton(onClick = { actions.onOpenExplore(ExploreRequest()) })
            }
        }
        val searchLabel = stringResource(R.string.discover_search_placeholder)
        GlassSurface(
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = AppSpacing.lg)
                .fillMaxWidth()
                .height(AppSize.button)
                .clickable(role = Role.Button) { actions.onOpenExplore(ExploreRequest(focusSearch = true)) }
                .semantics { contentDescription = searchLabel }
                .testTag("discover.search"),
        ) {
            Row(
                Modifier.fillMaxSize().padding(horizontal = AppSpacing.lg),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(AppIcons.search, contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(AppIconSize.md))
                Text(searchLabel, style = AppTypography.body, color = colors.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun HeroButton(onClick: () -> Unit) {
    val colors = AppTheme.colors
    val interaction = remember { MutableInteractionSource() }
    Row(
        Modifier
            .pressScale(interaction)
            .height(AppSize.chip + AppSpacing.sm)
            .clip(CircleShape)
            .background(colors.glassOnImage)
            .clickable(interactionSource = interaction, indication = androidx.compose.material3.ripple(), role = Role.Button, onClick = onClick)
            .padding(horizontal = AppSpacing.lg)
            .testTag("discover.heroCta"),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(stringResource(R.string.discover_hero_cta), style = AppTypography.label, color = colors.onGlassOnImage)
        Icon(AppIcons.chevronRight, contentDescription = null, tint = colors.onGlassOnImage, modifier = Modifier.size(AppIconSize.sm))
    }
}

@Composable
private fun UpcomingCard(restaurant: Restaurant, whenText: String, party: String, onClick: () -> Unit) {
    val colors = AppTheme.colors
    val interaction = remember { MutableInteractionSource() }
    Row(
        Modifier
            .fillMaxWidth()
            .pressScale(interaction)
            .clip(RoundedCornerShape(AppRadius.lg))
            .background(colors.espresso)
            .clickable(interactionSource = interaction, indication = androidx.compose.material3.ripple(), onClick = onClick)
            .padding(AppSpacing.md)
            .testTag("discover.upcoming"),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RemoteImage(
            restaurant.heroImage,
            contentDescription = restaurant.name,
            modifier = Modifier.size(AppSize.thumbnail).clip(RoundedCornerShape(AppRadius.md)),
        )
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs)) {
            Text(restaurant.name, style = AppSerif.title, color = colors.onEspresso, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(whenText, style = AppTypography.caption, color = colors.onEspresso)
            Text(party, style = AppTypography.caption, color = colors.onEspresso.copy(alpha = SPOTLIGHT_BODY_ALPHA))
        }
        Icon(AppIcons.chevronRight, contentDescription = null, tint = colors.accent, modifier = Modifier.size(AppIconSize.md))
    }
}

@Composable
private fun Spotlight(restaurant: Restaurant, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    val about = remember(restaurant.about) {
        restaurant.about.split(Regex("(?<=[.!?])\\s+")).take(SPOTLIGHT_SENTENCES).joinToString(" ")
    }
    Column(
        modifier
            .fillMaxWidth()
            .background(colors.espresso)
            .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.xxl)
            .testTag("discover.spotlight"),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        Overline(stringResource(R.string.discover_spotlight_overline))
        Text(restaurant.name, style = AppSerif.display, color = colors.onEspresso)
        Text(restaurant.tagline, style = AppSerif.italic(AppSerif.title), color = colors.accent)
        RemoteImage(
            url = restaurant.gallery.getOrNull(1) ?: restaurant.heroImage,
            contentDescription = restaurant.name,
            modifier = Modifier.fillMaxWidth().aspectRatio(SPOTLIGHT_PHOTO_ASPECT).clip(RoundedCornerShape(AppRadius.lg)),
        )
        Text(about, style = AppTypography.body, color = colors.onEspresso, modifier = Modifier.alpha(SPOTLIGHT_BODY_ALPHA))
        SecondaryButton(text = stringResource(R.string.discover_spotlight_cta), onClick = onOpen, color = colors.onEspresso)
    }
}

@Composable
private fun RestaurantCarousel(
    overline: String,
    title: String,
    restaurants: List<Restaurant>,
    content: DiscoverContentState,
    actions: DiscoverActions,
    testTagPrefix: String,
    modifier: Modifier = Modifier,
    onSeeAll: (() -> Unit)? = null,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        SectionHeader(title = title, overline = overline, onSeeAll = onSeeAll, modifier = Modifier.padding(horizontal = AppSpacing.lg))
        val rowState = rememberLazyListState()
        LazyRow(
            state = rowState,
            flingBehavior = rememberSnapFlingBehavior(rowState),
            contentPadding = PaddingValues(horizontal = AppSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        ) {
            items(restaurants, key = { it.id }) { restaurant ->
                RestaurantCard(
                    restaurant = restaurant,
                    availability = content.availability.getValue(restaurant.id),
                    saved = restaurant.id in content.savedIds,
                    onToggleSaved = { actions.onToggleSaved(restaurant.id) },
                    onClick = { actions.onOpenRestaurant(restaurant.id) },
                    modifier = Modifier.testTag("$testTagPrefix.${restaurant.id}"),
                )
            }
        }
    }
}

@Composable
private fun DiscoverSkeleton() {
    Column(
        Modifier.fillMaxSize().statusBarsPadding().padding(top = AppSpacing.xxxl),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
    ) {
        Skeleton(Modifier.padding(horizontal = AppSpacing.lg).fillMaxWidth().height(AppSize.heroHeight).clip(RoundedCornerShape(AppRadius.xl)))
        Row(Modifier.padding(horizontal = AppSpacing.lg), horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            CuisineId.entries.take(3).forEach { _ ->
                Skeleton(Modifier.size(AppSize.thumbnail, AppSize.chip).clip(CircleShape))
            }
        }
        Row(Modifier.padding(horizontal = AppSpacing.lg), horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            repeat(2) {
                Skeleton(Modifier.size(AppSize.featuredCardWidth, AppSize.featuredCardHeight).clip(RoundedCornerShape(AppRadius.xl)))
            }
        }
    }
}

@Preview
@Composable
private fun DiscoverLoadingPreview() {
    AppTheme(darkTheme = false) { DiscoverContent(state = DiscoverUiState.Loading, actions = DiscoverActions()) }
}
