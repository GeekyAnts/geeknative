package app.features.home

import androidx.lifecycle.ViewModel
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.catalog.Place
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class HomeUiState(
    val query: String = "",
    val featured: Destination? = null,
    val trending: List<Destination> = emptyList(),
    val popular: List<Place> = emptyList(),
    val inspiration: List<Destination> = emptyList(),
    val placesById: Map<String, Place> = emptyMap(),
    val destinationNames: Map<String, String> = emptyMap(),
    val fallbackImageUrl: String = "",
    val catalogError: Boolean = false,
)

class HomeViewModel(private val catalog: CatalogRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(load())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun onQueryChange(value: String) {
        _uiState.update { it.copy(query = value) }
    }

    fun trimmedQuery(): String = _uiState.value.query.trim()

    fun retry() {
        catalog.retry()
        val query = _uiState.value.query
        _uiState.value = load().copy(query = query)
    }

    private fun load(): HomeUiState {
        if (catalog.catalogOrNull() == null) return HomeUiState(catalogError = true)
        return HomeUiState(
            featured = catalog.featured(),
            trending = catalog.trending(),
            popular = catalog.popularPlaces(),
            inspiration = catalog.inspiration(),
            placesById = catalog.places().associateBy { it.id },
            destinationNames = catalog.destinations().associate { it.id to it.name },
            fallbackImageUrl = catalog.fallbackImageUrl(),
        )
    }
}
