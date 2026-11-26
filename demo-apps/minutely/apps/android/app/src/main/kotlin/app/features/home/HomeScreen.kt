package app.features.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.core.designsystem.IconCircle
import app.features.cart.CartBarHost
import app.features.cart.CartLine
import app.features.cart.CartState
import app.features.catalog.CategoryTile
import app.features.catalog.LocalCatalogRepository
import app.features.catalog.ProductCard
import app.features.catalog.RailCardWidth
import app.generated.AppConfig
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppIdentity
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onOpenSettings: () -> Unit,
    onOpenCart: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenCategory: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    HomeContent(
        state = state,
        onOpenSettings = onOpenSettings,
        onOpenCart = onOpenCart,
        onOpenSearch = onOpenSearch,
        onOpenCategory = onOpenCategory,
        onAdd = viewModel::add,
        onRemove = viewModel::remove,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeContent(
    state: HomeUiState,
    onOpenSettings: () -> Unit,
    onOpenCart: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenCategory: (String) -> Unit,
    onAdd: (String) -> Unit,
    onRemove: (String) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        AppIdentity.NAME,
                        style = AppTextStyles.titleBold,
                        color = AppTheme.colors.primary,
                        modifier = Modifier.semantics { heading() },
                    )
                },
                actions = {
                    CartAction(itemCount = state.cart.summary.itemCount, onClick = onOpenCart)
                    IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("home.openSettings")) {
                        Icon(AppIcons.settings, contentDescription = stringResource(R.string.home_open_settings))
                    }
                },
            )
        },
        bottomBar = { CartBarHost(summary = state.cart.summary, onOpenCart = onOpenCart) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(vertical = AppSpacing.sm),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                DeliveryPromise()
                SearchEntry(onClick = onOpenSearch)
            }
            PromoBanner(Modifier.padding(horizontal = AppSpacing.lg))

            Section(title = stringResource(R.string.home_categories_title)) {
                Column(
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
                ) {
                    state.categories.chunked(3).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                            row.forEach { category ->
                                CategoryTile(category, onClick = { onOpenCategory(category.id) }, modifier = Modifier.weight(1f))
                            }
                            repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                        }
                    }
                }
            }

            Section(title = stringResource(R.string.home_bestsellers_title)) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = AppSpacing.lg),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    items(state.bestsellers, key = { it.id }) { product ->
                        ProductCard(
                            product = product,
                            quantity = state.cart.quantity(product.id),
                            onAdd = { onAdd(product.id) },
                            onRemove = { onRemove(product.id) },
                            modifier = Modifier.width(RailCardWidth),
                        )
                    }
                }
            }
            Spacer(Modifier.height(AppSpacing.sm))
        }
    }
}

@Composable
private fun CartAction(itemCount: Int, onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.testTag("home.openCart")) {
        BadgedBox(
            badge = {
                if (itemCount > 0) {
                    Badge(
                        containerColor = AppTheme.colors.primary,
                        contentColor = AppTheme.colors.onPrimary,
                    ) { Text(itemCount.toString(), modifier = Modifier.testTag("home.cartBadge")) }
                }
            },
        ) {
            Icon(AppIcons.cart, contentDescription = stringResource(R.string.home_open_cart))
        }
    }
}

/** Delivery in N minutes, with the address under it. Yellow is for speed. */
@Composable
private fun DeliveryPromise() {
    Row(
        modifier = Modifier.testTag("home.delivery"),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        IconCircle(
            icon = AppIcons.fast,
            background = AppTheme.colors.accent,
            tint = AppTheme.colors.onAccent,
            size = 48.dp,
        )
        Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs / 2)) {
            Text(
                stringResource(R.string.common_delivery_in, AppConfig.deliveryMinutes),
                style = AppTypography.headline,
                color = AppTheme.colors.onBackground,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Icon(
                    AppIcons.location,
                    contentDescription = null,
                    tint = AppTheme.colors.onSurfaceVariant,
                    modifier = Modifier.size(AppIconSize.sm),
                )
                Text(
                    stringResource(R.string.common_delivery_address),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                )
            }
        }
    }
}

/** A field-shaped button that opens Search (DESIGN.md: Field-shaped button). */
@Composable
private fun SearchEntry(onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .testTag("home.search"),
        shape = RoundedCornerShape(AppRadius.full),
        color = AppTheme.colors.surface,
        contentColor = AppTheme.colors.onSurfaceVariant,
        border = BorderStroke(1.dp, AppTheme.colors.outline),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        ) {
            Icon(AppIcons.search, contentDescription = null, tint = AppTheme.colors.primary, modifier = Modifier.size(AppIconSize.md))
            Text(stringResource(R.string.search_placeholder), style = AppTypography.body)
        }
    }
}

@Composable
private fun PromoBanner(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth().testTag("home.banner"),
        shape = RoundedCornerShape(AppRadius.xl),
        color = AppTheme.colors.banner,
        contentColor = AppTheme.colors.onBanner,
    ) {
        Box {
            // Decorative, large and partly off the trailing edge.
            Text(
                "🛒",
                fontSize = 96.sp,
                lineHeight = 96.sp,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = AppSpacing.sm)
                    .clearAndSetSemantics {},
            )
            Column(
                modifier = Modifier
                    .padding(AppSpacing.xl)
                    .padding(end = 88.dp),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            ) {
                Surface(
                    shape = RoundedCornerShape(AppRadius.full),
                    color = AppTheme.colors.accent,
                    contentColor = AppTheme.colors.onAccent,
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = AppSpacing.md, vertical = AppSpacing.xs),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                    ) {
                        Icon(AppIcons.fast, contentDescription = null, modifier = Modifier.size(AppIconSize.sm))
                        Text(stringResource(R.string.home_banner_eyebrow), style = AppTextStyles.captionBold)
                    }
                }
                Text(stringResource(R.string.home_banner_title), style = AppTypography.headline)
                Text(
                    stringResource(R.string.home_banner_body, AppConfig.freeDeliveryThreshold),
                    style = AppTypography.body,
                    color = AppTheme.colors.onBanner.copy(alpha = 0.8f),
                )
            }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        Text(
            title,
            style = AppTextStyles.titleBold,
            color = AppTheme.colors.onBackground,
            modifier = Modifier.padding(horizontal = AppSpacing.lg).semantics { heading() },
        )
        content()
    }
}

private fun previewState(): HomeUiState {
    val catalog = LocalCatalogRepository()
    return HomeUiState(
        categories = catalog.categories(),
        bestsellers = catalog.bestsellers(),
        cart = CartState.of(listOf(CartLine("banana", 2), CartLine("milk", 1)), catalog),
    )
}

@Preview(heightDp = 1400)
@Composable
private fun HomeScreenPreview() {
    AppTheme(darkTheme = false) {
        HomeContent(previewState(), {}, {}, {}, {}, {}, {})
    }
}

@Preview(heightDp = 1400)
@Composable
private fun HomeScreenDarkPreview() {
    AppTheme(darkTheme = true) {
        HomeContent(previewState(), {}, {}, {}, {}, {}, {})
    }
}
