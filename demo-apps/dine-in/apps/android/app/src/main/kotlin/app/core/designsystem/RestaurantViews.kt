package app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import app.R
import app.features.catalog.Collection
import app.features.catalog.Restaurant
import app.features.catalog.TodayAvailability
import app.features.catalog.rememberFormatters
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppPlurals
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

private const val MAX_PRICE_LEVEL = 4

/** `starFilled` in `accent` + the rating with one decimal. */
@Composable
fun RatingBadge(rating: Double, modifier: Modifier = Modifier, color: Color = AppTheme.colors.onSurface) {
    val formatted = rememberFormatters().rating(rating)
    val label = stringResource(R.string.restaurant_rating_label, formatted)
    Row(
        modifier.clearAndSetSemantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xxs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(AppIcons.starFilled, contentDescription = null, tint = AppTheme.colors.accent, modifier = Modifier.size(AppIconSize.sm))
        Text(formatted, style = AppTypography.label, color = color)
    }
}

/** The price symbol repeated [level] times in [color], the rest up to 4 in `outline`. */
@Composable
fun PriceLevel(level: Int, modifier: Modifier = Modifier, color: Color = AppTheme.colors.onSurface, dimColor: Color = AppTheme.colors.outline) {
    val symbol = rememberFormatters().priceSymbol
    val label = stringResource(R.string.restaurant_price_label, level)
    val text = buildAnnotatedString {
        withStyle(SpanStyle(color = color)) { append(symbol.repeat(level.coerceIn(0, MAX_PRICE_LEVEL))) }
        withStyle(SpanStyle(color = dimColor)) { append(symbol.repeat((MAX_PRICE_LEVEL - level).coerceAtLeast(0))) }
    }
    Text(text, style = AppTypography.label, modifier = modifier.clearAndSetSemantics { contentDescription = label })
}

/** A coloured dot + caption for today's demo availability. */
@Composable
fun AvailabilityIndicator(availability: TodayAvailability, modifier: Modifier = Modifier, textColor: Color = AppTheme.colors.onSurfaceVariant) {
    val colors = AppTheme.colors
    val (dot, label) = when (availability) {
        TodayAvailability.Available -> colors.success to R.string.restaurant_availability_available
        TodayAvailability.Full -> colors.warning to R.string.restaurant_availability_full
        TodayAvailability.Closed -> colors.error to R.string.restaurant_availability_closed
    }
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(AppSpacing.sm).background(dot, CircleShape))
        Text(stringResource(label), style = AppTypography.caption, color = textColor)
    }
}

@Composable
private fun Modifier.pressableCard(onClick: () -> Unit): Modifier {
    val interaction = remember { MutableInteractionSource() }
    return this
        .pressScale(interaction)
        .clickable(interactionSource = interaction, indication = ripple(), onClick = onClick)
}

/** Tall featured card with a full-bleed photo (DESIGN.md: RestaurantCard). */
@Composable
fun RestaurantCard(
    restaurant: Restaurant,
    availability: TodayAvailability,
    saved: Boolean,
    onToggleSaved: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    val shape = RoundedCornerShape(AppRadius.xl)
    Box(
        modifier
            .size(AppSize.featuredCardWidth, AppSize.featuredCardHeight)
            .pressableCard(onClick)
            .clip(shape),
    ) {
        RemoteImage(restaurant.heroImage, contentDescription = restaurant.name, modifier = Modifier.fillMaxSize())
        PhotoScrim()
        FavouriteButton(
            saved = saved,
            onToggle = onToggleSaved,
            restaurantId = restaurant.id,
            modifier = Modifier.align(Alignment.TopEnd).padding(AppSpacing.md),
        )
        GlassSurface(
            shape = RoundedCornerShape(AppRadius.lg),
            floating = false,
            strong = true,
            modifier = Modifier.align(Alignment.BottomStart).padding(AppSpacing.md).fillMaxWidth(),
        ) {
            Column(Modifier.padding(AppSpacing.md), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Overline(stringResource(restaurant.cuisine.label))
                Text(restaurant.name, style = AppSerif.title, color = colors.onSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                    Text(restaurant.neighbourhood, style = AppTypography.caption, color = colors.onSurfaceVariant)
                    RatingBadge(restaurant.rating)
                    PriceLevel(restaurant.priceLevel)
                }
                AvailabilityIndicator(availability)
            }
        }
    }
}

/** Full-width solid card with the photo on top (DESIGN.md: RestaurantListItem). */
@Composable
fun RestaurantListItem(
    restaurant: Restaurant,
    availability: TodayAvailability,
    saved: Boolean,
    onToggleSaved: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    val formatters = rememberFormatters()
    val shape = RoundedCornerShape(AppRadius.lg)
    Column(
        modifier
            .fillMaxWidth()
            .pressableCard(onClick)
            .clip(shape)
            .background(colors.surface),
    ) {
        Box(Modifier.fillMaxWidth().height(AppSize.listImageHeight)) {
            RemoteImage(restaurant.heroImage, contentDescription = restaurant.name, modifier = Modifier.fillMaxSize())
            FavouriteButton(
                saved = saved,
                onToggle = onToggleSaved,
                restaurantId = restaurant.id,
                modifier = Modifier.align(Alignment.TopEnd).padding(AppSpacing.md),
            )
        }
        Column(Modifier.padding(AppSpacing.lg), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
            GoldRule()
            Text(restaurant.name, style = AppSerif.title, color = colors.onSurface)
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                RatingBadge(restaurant.rating)
                Text(AppPlurals.restaurantReviewCount(restaurant.reviewCount), style = AppTypography.caption, color = colors.onSurfaceVariant)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    formatters.separator(stringResource(restaurant.cuisine.label), restaurant.neighbourhood),
                    style = AppTypography.caption,
                    color = colors.onSurfaceVariant,
                )
                PriceLevel(restaurant.priceLevel)
            }
            Text(restaurant.tagline, style = AppTypography.body, color = colors.onSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
            AvailabilityIndicator(availability)
        }
    }
}

/** Square photo, serif name and rating + price, two per row on phones (DESIGN.md: RestaurantGridItem). */
@Composable
fun RestaurantGridItem(restaurant: Restaurant, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Column(modifier.pressableCard(onClick), verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
        RemoteImage(
            restaurant.heroImage,
            contentDescription = restaurant.name,
            modifier = Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(AppRadius.lg)),
        )
        Text(restaurant.name, style = AppSerif.title, color = colors.onBackground, maxLines = 2, overflow = TextOverflow.Ellipsis)
        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
            RatingBadge(restaurant.rating)
            PriceLevel(restaurant.priceLevel)
        }
    }
}

/** An editorial collection with a photo, serif title and caption (DESIGN.md: CollectionCard). */
@Composable
fun CollectionCard(collection: Collection, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    val title = stringResource(collection.id.title)
    Box(
        modifier
            .size(AppSize.collectionCardWidth, AppSize.collectionCardHeight)
            .pressableCard(onClick)
            .clip(RoundedCornerShape(AppRadius.lg)),
    ) {
        RemoteImage(collection.image, contentDescription = null, modifier = Modifier.fillMaxSize())
        PhotoScrim()
        GlassSurface(
            shape = RoundedCornerShape(AppRadius.md),
            floating = false,
            strong = true,
            modifier = Modifier.align(Alignment.BottomStart).padding(AppSpacing.md).fillMaxWidth(),
        ) {
            Column(Modifier.padding(AppSpacing.md), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Text(title, style = AppSerif.title, color = colors.onSurface)
                Text(stringResource(collection.id.subtitle), style = AppTypography.caption, color = colors.onSurfaceVariant)
            }
        }
    }
}
