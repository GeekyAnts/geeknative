package app.features.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.cart.CartRepository
import app.features.cart.CartState
import app.features.catalog.CatalogRepository
import app.features.catalog.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** What the Search screen shows below the field. */
sealed interface SearchResults {
    /** The query is blank. */
    data object Prompt : SearchResults

    data class Found(val products: List<Product>) : SearchResults

    /** Nothing matched [query] (trimmed). */
    data class Empty(val query: String) : SearchResults
}

data class SearchUiState(
    val query: String = "",
    val results: SearchResults = SearchResults.Prompt,
    val cart: CartState = CartState(),
)

/** State and actions for Search. The query isn't stored: each visit starts empty. */
class SearchViewModel(private val catalog: CatalogRepository, private val cartRepository: CartRepository) : ViewModel() {
    private val _query = MutableStateFlow("")

    /** The field's text, exposed on its own so typing never waits on the results. */
    val query: StateFlow<String> = _query

    val uiState: StateFlow<SearchUiState> = combine(_query, cartRepository.lines) { query, lines ->
        SearchUiState(query, resultsFor(query), CartState.of(lines, catalog))
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SearchUiState())

    fun setQuery(value: String) {
        _query.value = value
    }

    fun clear() {
        _query.value = ""
    }

    fun add(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }

    fun remove(productId: String) {
        viewModelScope.launch { cartRepository.remove(productId) }
    }

    private fun resultsFor(query: String): SearchResults {
        if (query.isBlank()) return SearchResults.Prompt
        val products = catalog.search(query)
        return if (products.isEmpty()) SearchResults.Empty(query.trim()) else SearchResults.Found(products)
    }
}
