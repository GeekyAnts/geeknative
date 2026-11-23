package app.features.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.features.cart.CartBarHost
import app.features.cart.CartLine
import app.features.cart.CartState
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun CategoryScreen(viewModel: CategoryViewModel, onBack: () -> Unit, onOpenCart: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    CategoryContent(
        state = state,
        onBack = onBack,
        onOpenCart = onOpenCart,
        onSelect = viewModel::select,
        onAdd = viewModel::add,
        onRemove = viewModel::remove,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryContent(
    state: CategoryUiState,
    onBack: () -> Unit,
    onOpenCart: () -> Unit,
    onSelect: (String) -> Unit,
    onAdd: (String) -> Unit,
    onRemove: (String) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(state.selected.name, style = AppTextStyles.titleBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back))
                    }
                },
            )
        },
        bottomBar = { CartBarHost(summary = state.cart.summary, onOpenCart = onOpenCart) },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            CategoryChips(categories = state.categories, selected = state.selected, onSelect = onSelect)
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = AppSpacing.lg, end = AppSpacing.lg, top = AppSpacing.sm, bottom = AppSpacing.xl),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                items(state.products, key = { it.id }) { product ->
                    ProductCard(
                        product = product,
                        quantity = state.cart.quantity(product.id),
                        onAdd = { onAdd(product.id) },
                        onRemove = { onRemove(product.id) },
                        modifier = Modifier.animateItem(),
                    )
                }
            }
        }
    }
}

/** Every category as a Material 3 FilterChip, the current one selected and scrolled into view. */
@Composable
private fun CategoryChips(categories: List<Category>, selected: Category, onSelect: (String) -> Unit) {
    val listState = rememberLazyListState()
    LaunchedEffect(selected.id) {
        val index = categories.indexOfFirst { it.id == selected.id }
        if (index >= 0) listState.animateScrollToItem(index)
    }
    LazyRow(
        state = listState,
        contentPadding = PaddingValues(horizontal = AppSpacing.lg, vertical = AppSpacing.sm),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        items(categories, key = { it.id }) { category ->
            val isSelected = category.id == selected.id
            FilterChip(
                selected = isSelected,
                onClick = { onSelect(category.id) },
                label = { Text("${category.emoji}  ${category.name}", style = AppTypography.label) },
                modifier = Modifier.heightIn(min = 40.dp).testTag("category.chip.${category.id}"),
                shape = RoundedCornerShape(AppRadius.full),
                colors = FilterChipDefaults.filterChipColors(
                    containerColor = AppTheme.colors.surface,
                    labelColor = AppTheme.colors.onSurface,
                    selectedContainerColor = AppTheme.colors.primary,
                    selectedLabelColor = AppTheme.colors.onPrimary,
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = isSelected,
                    borderColor = AppTheme.colors.outline,
                    selectedBorderColor = AppTheme.colors.primary,
                ),
            )
        }
    }
}

@Preview(heightDp = 900)
@Composable
private fun CategoryScreenPreview() {
    val catalog = LocalCatalogRepository()
    val category = catalog.categories()[2]
    AppTheme(darkTheme = false) {
        CategoryContent(
            state = CategoryUiState(
                categories = catalog.categories(),
                selected = category,
                products = catalog.products(category.id),
                cart = CartState.of(listOf(CartLine("cookies", 1)), catalog),
            ),
            onBack = {}, onOpenCart = {}, onSelect = {}, onAdd = {}, onRemove = {},
        )
    }
}
