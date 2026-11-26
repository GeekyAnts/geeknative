package app.features.cart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AmountRow
import app.core.designsystem.AppCard
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.core.designsystem.Artwork
import app.core.designsystem.EmptyState
import app.core.designsystem.IconCircle
import app.core.designsystem.PrimaryButton
import app.core.designsystem.StruckPrice
import app.features.catalog.LocalCatalogRepository
import app.features.catalog.QuantityStepper
import app.features.catalog.categoryTint
import app.generated.AppConfig
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun CartScreen(viewModel: CartViewModel, onBack: () -> Unit, onStartShopping: () -> Unit, onOrderPlaced: (String) -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    CartContent(
        state = state,
        onBack = onBack,
        onStartShopping = onStartShopping,
        onAdd = viewModel::add,
        onRemove = viewModel::remove,
        onPlaceOrder = { viewModel.placeOrder(onOrderPlaced) },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartContent(
    state: CartUiState,
    onBack: () -> Unit,
    onStartShopping: () -> Unit,
    onAdd: (String) -> Unit,
    onRemove: (String) -> Unit,
    onPlaceOrder: () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.cart_title), style = AppTextStyles.titleBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back))
                    }
                },
            )
        },
        bottomBar = {
            if (!state.isEmpty) CheckoutBar(state.summary, enabled = !state.isPlacingOrder, onPlaceOrder = onPlaceOrder)
        },
    ) { padding ->
        when {
            !state.isLoaded -> Unit
            state.isEmpty -> EmptyState(
                icon = AppIcons.cart,
                title = stringResource(R.string.cart_empty_title),
                body = stringResource(R.string.cart_empty_body),
                actionLabel = stringResource(R.string.cart_start_shopping),
                actionTag = "cart.startShopping",
                onAction = onStartShopping,
                modifier = Modifier.padding(padding).testTag("cart.empty"),
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = AppSpacing.lg,
                    end = AppSpacing.lg,
                    top = padding.calculateTopPadding() + AppSpacing.sm,
                    bottom = padding.calculateBottomPadding() + AppSpacing.xl,
                ),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                item(key = "delivery") { DeliveryCard(state.summary.itemCount) }
                item(key = "lines") { LinesCard(state.items, onAdd, onRemove) }
                item(key = "free") { FreeDeliveryCard(state.summary) }
                item(key = "bill") { BillCard(state.summary) }
                item(key = "address") { AddressCard() }
            }
        }
    }
}

@Composable
private fun DeliveryCard(itemCount: Int) {
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            IconCircle(AppIcons.delivery, background = AppTheme.colors.accent, tint = AppTheme.colors.onAccent, size = 44.dp)
            Column {
                Text(stringResource(R.string.common_delivery_in, AppConfig.deliveryMinutes), style = AppTextStyles.titleBold)
                Text(
                    pluralStringResource(R.plurals.cart_shipment, itemCount, itemCount),
                    style = AppTypography.caption,
                    color = AppTheme.colors.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun LinesCard(items: List<CartItem>, onAdd: (String) -> Unit, onRemove: (String) -> Unit) {
    AppCard {
        items.forEachIndexed { index, item ->
            if (index > 0) HorizontalDivider(color = AppTheme.colors.outline, modifier = Modifier.padding(vertical = AppSpacing.xs))
            CartLineRow(item, onAdd = { onAdd(item.product.id) }, onRemove = { onRemove(item.product.id) })
        }
    }
}

@Composable
private fun CartLineRow(item: CartItem, onAdd: () -> Unit, onRemove: () -> Unit) {
    val product = item.product
    Row(
        modifier = Modifier.fillMaxWidth().testTag("cart.line.${product.id}"),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        Artwork(product.emoji, categoryTint(product.categoryId), Modifier.size(56.dp), emojiSize = 30.sp, radius = AppRadius.md)
        Column(Modifier.weight(1f)) {
            Text(product.name, style = AppTypography.label, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(product.unit, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
        }
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
            QuantityStepper(product.name, item.quantity, "product.${product.id}", onAdd, onRemove)
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs), verticalAlignment = Alignment.CenterVertically) {
                Text(stringResource(R.string.common_price, item.lineTotal), style = AppTextStyles.price)
                if (item.lineMrp > item.lineTotal) {
                    StruckPrice(
                        stringResource(R.string.common_price, item.lineMrp),
                        stringResource(R.string.common_mrp, item.lineMrp),
                    )
                }
            }
        }
    }
}

@Composable
private fun FreeDeliveryCard(summary: CartSummary) {
    val unlocked = summary.amountToFreeDelivery == 0
    val progress by animateFloatAsState(if (unlocked) 1f else summary.freeDeliveryProgress, label = "freeDelivery")
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            Icon(AppIcons.delivery, contentDescription = null, tint = AppTheme.colors.primary, modifier = Modifier.size(AppIconSize.md))
            Text(
                if (unlocked) {
                    stringResource(R.string.cart_free_delivery_unlocked)
                } else {
                    stringResource(R.string.cart_free_delivery_nudge, summary.amountToFreeDelivery)
                },
                style = AppTextStyles.labelBold,
                color = if (unlocked) AppTheme.colors.primary else AppTheme.colors.onSurface,
                modifier = Modifier.testTag("cart.freeDelivery"),
            )
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(AppRadius.full)),
            color = AppTheme.colors.primary,
            trackColor = AppTheme.colors.surfaceVariant,
            gapSize = 0.dp,
            drawStopIndicator = {},
        )
    }
}

@Composable
private fun BillCard(summary: CartSummary) {
    AppCard {
        Text(stringResource(R.string.cart_bill_title), style = AppTextStyles.titleBold)
        AmountRow(stringResource(R.string.cart_item_total)) {
            Text(
                stringResource(R.string.common_price, summary.itemTotal),
                style = AppTypography.body,
                modifier = Modifier.testTag("cart.itemTotal"),
            )
            if (summary.savings > 0) {
                StruckPrice(
                    stringResource(R.string.common_price, summary.mrpTotal),
                    stringResource(R.string.common_mrp, summary.mrpTotal),
                )
            }
        }
        AmountRow(stringResource(R.string.cart_delivery_fee)) {
            if (summary.deliveryFee == 0) {
                Text(
                    stringResource(R.string.cart_free),
                    style = AppTextStyles.labelBold,
                    color = AppTheme.colors.primary,
                    modifier = Modifier.testTag("cart.deliveryFee"),
                )
            } else {
                Text(
                    stringResource(R.string.common_price, summary.deliveryFee),
                    style = AppTypography.body,
                    modifier = Modifier.testTag("cart.deliveryFee"),
                )
            }
        }
        HorizontalDivider(color = AppTheme.colors.outline, modifier = Modifier.padding(vertical = AppSpacing.xs))
        AmountRow(stringResource(R.string.cart_to_pay), labelStyle = AppTextStyles.price) {
            Text(
                stringResource(R.string.common_price, summary.toPay),
                style = AppTextStyles.price,
                modifier = Modifier.testTag("cart.toPay"),
            )
        }
        if (summary.savings > 0) {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(top = AppSpacing.xs).testTag("cart.savings"),
                shape = RoundedCornerShape(AppRadius.md),
                color = AppTheme.colors.surfaceVariant,
                contentColor = AppTheme.colors.primary,
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    Icon(AppIcons.savings, contentDescription = null, modifier = Modifier.size(AppIconSize.sm))
                    Text(stringResource(R.string.cart_savings, summary.savings), style = AppTextStyles.labelBold)
                }
            }
        }
    }
}

@Composable
private fun AddressCard() {
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            IconCircle(AppIcons.location, background = AppTheme.colors.surfaceVariant, tint = AppTheme.colors.primary, size = 44.dp)
            Column {
                Text(stringResource(R.string.cart_deliver_to), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                Text(stringResource(R.string.common_delivery_address), style = AppTypography.body)
            }
        }
    }
}

/** Pinned to the bottom: what you'll pay, and Place order. */
@Composable
private fun CheckoutBar(summary: CartSummary, enabled: Boolean, onPlaceOrder: () -> Unit) {
    Surface(color = AppTheme.colors.surface, contentColor = AppTheme.colors.onSurface) {
        Column {
            HorizontalDivider(color = AppTheme.colors.outline)
            Row(
                modifier = Modifier
                    .navigationBarsPadding()
                    .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                Column(Modifier.weight(1f)) {
                    Text(stringResource(R.string.common_price, summary.toPay), style = AppTextStyles.titleBold)
                    Text(stringResource(R.string.cart_payment_note), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                }
                PrimaryButton(
                    text = stringResource(R.string.cart_place_order),
                    onClick = onPlaceOrder,
                    enabled = enabled,
                    modifier = Modifier.testTag("cart.placeOrder"),
                )
            }
        }
    }
}

private fun previewState(vararg lines: CartLine): CartUiState {
    val catalog = LocalCatalogRepository()
    return CartUiState(
        items = lines.map { CartItem(catalog.product(it.productId)!!, it.quantity) },
        summary = CartSummary.of(lines.toList(), catalog),
        isLoaded = true,
    )
}

@Preview(heightDp = 1300)
@Composable
private fun CartScreenPreview() {
    AppTheme(darkTheme = false) {
        CartContent(previewState(CartLine("banana", 2), CartLine("milk", 1)), {}, {}, {}, {}, {})
    }
}

@Preview(heightDp = 1300)
@Composable
private fun CartScreenDarkPreview() {
    AppTheme(darkTheme = true) {
        CartContent(previewState(CartLine("banana", 2), CartLine("detergent", 1)), {}, {}, {}, {}, {})
    }
}

@Preview
@Composable
private fun CartEmptyPreview() {
    AppTheme(darkTheme = false) {
        CartContent(CartUiState(isLoaded = true), {}, {}, {}, {}, {})
    }
}
