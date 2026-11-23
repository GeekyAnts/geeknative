package app.features.search

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.EmptyState
import app.features.cart.CartBarHost
import app.features.cart.CartState
import app.features.catalog.LocalCatalogRepository
import app.features.catalog.ProductCard
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun SearchScreen(viewModel: SearchViewModel, onBack: () -> Unit, onOpenCart: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val query by viewModel.query.collectAsStateWithLifecycle()
    SearchContent(
        state = state.copy(query = query),
        onQueryChange = viewModel::setQuery,
        onClear = viewModel::clear,
        onBack = onBack,
        onOpenCart = onOpenCart,
        onAdd = viewModel::add,
        onRemove = viewModel::remove,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchContent(
    state: SearchUiState,
    onQueryChange: (String) -> Unit,
    onClear: () -> Unit,
    onBack: () -> Unit,
    onOpenCart: () -> Unit,
    onAdd: (String) -> Unit,
    onRemove: (String) -> Unit,
    autoFocus: Boolean = true,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back))
                    }
                },
                title = { SearchField(state.query, onQueryChange, onClear, autoFocus) },
            )
        },
        bottomBar = { CartBarHost(summary = state.cart.summary, onOpenCart = onOpenCart) },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (val results = state.results) {
                SearchResults.Prompt -> EmptyState(
                    icon = AppIcons.search,
                    title = stringResource(R.string.search_prompt_title),
                    body = stringResource(R.string.search_prompt_body),
                    modifier = Modifier.testTag("search.prompt"),
                )
                is SearchResults.Empty -> EmptyState(
                    icon = AppIcons.noResults,
                    title = stringResource(R.string.search_no_results_title, results.query),
                    body = stringResource(R.string.search_no_results_body),
                    modifier = Modifier.testTag("search.empty"),
                )
                is SearchResults.Found -> LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = AppSpacing.lg, end = AppSpacing.lg, top = AppSpacing.sm, bottom = AppSpacing.xl),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Text(
                            pluralStringResource(R.plurals.search_result_count, results.products.size, results.products.size),
                            style = AppTypography.label,
                            color = AppTheme.colors.onSurfaceVariant,
                            modifier = Modifier.testTag("search.resultCount"),
                        )
                    }
                    items(results.products, key = { it.id }) { product ->
                        ProductCard(
                            product = product,
                            quantity = state.cart.quantity(product.id),
                            onAdd = { onAdd(product.id) },
                            onRemove = { onRemove(product.id) },
                        )
                    }
                }
            }
        }
    }
}

/** A capsule field like Home's search entry, focused when Search opens. */
@Composable
private fun SearchField(query: String, onQueryChange: (String) -> Unit, onClear: () -> Unit, autoFocus: Boolean) {
    val focusRequester = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current
    if (autoFocus) LaunchedEffect(Unit) { focusRequester.requestFocus() }

    Surface(
        modifier = Modifier.fillMaxWidth().padding(end = AppSpacing.lg).heightIn(min = 48.dp),
        shape = RoundedCornerShape(AppRadius.full),
        color = AppTheme.colors.surface,
        border = BorderStroke(1.dp, AppTheme.colors.outline),
    ) {
        Row(
            modifier = Modifier.padding(start = AppSpacing.lg),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
        ) {
            Icon(AppIcons.search, contentDescription = null, tint = AppTheme.colors.primary, modifier = Modifier.size(AppIconSize.md))
            Box(Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                if (query.isEmpty()) {
                    Text(stringResource(R.string.search_placeholder), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant, maxLines = 1)
                }
                BasicTextField(
                    value = query,
                    onValueChange = onQueryChange,
                    singleLine = true,
                    textStyle = AppTypography.body.copy(color = AppTheme.colors.onSurface),
                    cursorBrush = SolidColor(AppTheme.colors.primary),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { keyboard?.hide() }),
                    modifier = Modifier.fillMaxWidth().focusRequester(focusRequester).testTag("search.field"),
                )
            }
            if (query.isNotEmpty()) {
                IconButton(onClick = onClear, modifier = Modifier.testTag("search.clear")) {
                    Icon(
                        AppIcons.clear,
                        contentDescription = stringResource(R.string.search_clear),
                        tint = AppTheme.colors.onSurfaceVariant,
                        modifier = Modifier.size(AppIconSize.md),
                    )
                }
            } else {
                Box(Modifier.size(AppSpacing.sm))
            }
        }
    }
}

@Preview(heightDp = 800)
@Composable
private fun SearchScreenPreview() {
    val catalog = LocalCatalogRepository()
    AppTheme(darkTheme = false) {
        SearchContent(
            state = SearchUiState(query = "choco", results = SearchResults.Found(catalog.search("choco"))),
            onQueryChange = {}, onClear = {}, onBack = {}, onOpenCart = {}, onAdd = {}, onRemove = {}, autoFocus = false,
        )
    }
}

@Preview(heightDp = 800)
@Composable
private fun SearchPromptPreview() {
    AppTheme(darkTheme = true) {
        SearchContent(
            state = SearchUiState(cart = CartState()),
            onQueryChange = {}, onClear = {}, onBack = {}, onOpenCart = {}, onAdd = {}, onRemove = {}, autoFocus = false,
        )
    }
}
