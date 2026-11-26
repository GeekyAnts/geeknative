package app.features.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.R
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.core.designsystem.Artwork
import app.core.designsystem.StruckPrice
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

/** Width of a product card in a horizontal rail. */
val RailCardWidth = 168.dp

/** The tile color for a category: the token `tile<Id>` (DESIGN.md, Color roles). */
@Composable
fun categoryTint(categoryId: String): Color = with(AppTheme.colors) {
    when (categoryId) {
        "fruits" -> tileFruits
        "dairy" -> tileDairy
        "snacks" -> tileSnacks
        "drinks" -> tileDrinks
        "household" -> tileHousehold
        "personal" -> tilePersonal
        else -> surfaceVariant
    }
}

/**
 * A product, as shown on Home, Category and Search (spec/features/catalog.md: Product card).
 * [quantity] is the product's cart quantity, so the same product shows the same count everywhere.
 */
@Composable
fun ProductCard(
    product: Product,
    quantity: Int,
    onAdd: () -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.testTag("product.${product.id}"),
        shape = RoundedCornerShape(AppRadius.lg),
        color = AppTheme.colors.surface,
        contentColor = AppTheme.colors.onSurface,
    ) {
        Column(Modifier.padding(AppSpacing.sm)) {
            Box {
                Artwork(
                    emoji = product.emoji,
                    tint = categoryTint(product.categoryId),
                    modifier = Modifier.fillMaxWidth().aspectRatio(1.15f),
                    emojiSize = 56.sp,
                    radius = AppRadius.md,
                )
                if (product.discountPercent > 0) {
                    DiscountBadge(product.discountPercent, Modifier.align(Alignment.TopStart))
                }
            }
            Column(
                modifier = Modifier.padding(horizontal = AppSpacing.xs).padding(top = AppSpacing.sm),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
            ) {
                Text(product.unit, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant, maxLines = 1)
                Text(
                    product.name,
                    style = AppTypography.label.copy(fontWeight = FontWeight.SemiBold),
                    color = AppTheme.colors.onSurface,
                    maxLines = 2,
                    minLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(AppSpacing.xs))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            stringResource(R.string.common_price, product.price),
                            style = AppTextStyles.price,
                            color = AppTheme.colors.onSurface,
                        )
                        if (product.mrp > product.price) {
                            StruckPrice(
                                text = stringResource(R.string.common_price, product.mrp),
                                description = stringResource(R.string.common_mrp, product.mrp),
                            )
                        }
                    }
                    QuantityStepper(
                        productName = product.name,
                        quantity = quantity,
                        tagPrefix = "product.${product.id}",
                        onAdd = onAdd,
                        onRemove = onRemove,
                    )
                }
            }
        }
    }
}

/** `common.percentOff` on `deal`, tucked into the artwork's top-leading corner. */
@Composable
private fun DiscountBadge(percent: Int, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(topStart = AppRadius.md, bottomEnd = AppRadius.md),
        color = AppTheme.colors.deal,
        contentColor = AppTheme.colors.onDeal,
    ) {
        Text(
            stringResource(R.string.common_percent_off, percent),
            style = AppTextStyles.captionBold,
            modifier = Modifier.padding(horizontal = AppSpacing.sm, vertical = AppSpacing.xs / 2),
        )
    }
}

/** A category's emoji on its tint, with its name below (spec/features/catalog.md: Category tile). */
@Composable
fun CategoryTile(category: Category, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        onClick = onClick,
        modifier = modifier.testTag("category.${category.id}"),
        shape = RoundedCornerShape(AppRadius.lg),
        color = AppTheme.colors.background,
        contentColor = AppTheme.colors.onBackground,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Artwork(
                emoji = category.emoji,
                tint = categoryTint(category.id),
                modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                emojiSize = 44.sp,
            )
            Text(
                category.name,
                style = AppTypography.caption.copy(fontWeight = FontWeight.SemiBold),
                color = AppTheme.colors.onBackground,
                maxLines = 2,
                minLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = AppSpacing.sm, start = AppSpacing.xs, end = AppSpacing.xs),
            )
        }
    }
}

@Preview
@Composable
private fun ProductCardPreview() {
    val catalog = LocalCatalogRepository()
    AppTheme(darkTheme = false) {
        Row(Modifier.padding(AppSpacing.lg), horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            ProductCard(catalog.product("banana")!!, 0, {}, {}, Modifier.width(RailCardWidth))
            ProductCard(catalog.product("milk")!!, 2, {}, {}, Modifier.width(RailCardWidth))
        }
    }
}

@Preview
@Composable
private fun CategoryTilePreview() {
    AppTheme(darkTheme = true) {
        CategoryTile(LocalCatalogRepository().categories().first(), {}, Modifier.width(110.dp))
    }
}
