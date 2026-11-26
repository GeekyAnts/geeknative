package app.features.explore

import androidx.lifecycle.ViewModel
import app.features.catalog.CatalogRepository
import app.features.catalog.Destination
import app.features.catalog.Place
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class ExploreUiState(
    val query: String = "",
    val category: String? = null,
    val destinations: List<Destination> = emptyList(),
    val places: List<Place> = emptyList(),
    val destinationNames: Map<String, String> = emptyMap(),
    val fallbackImageUrl: String = "",
    val empty: Boolean = false,
)

class ExploreViewModel(
    private val catalog: CatalogRepository,
    initialQuery: String? = null,
    initialCategory: String? = null,
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        filter(initialQuery.orEmpty(), initialCategory?.takeIf { it.isNotBlank() }),
    )
    val uiState: StateFlow<ExploreUiState> = _uiState.asStateFlow()

    fun onQueryChange(value: String) {
        _uiState.update { filter(value, it.category) }
    }

    fun onCategory(id: String) {
        _uiState.update { current ->
            val next = if (current.category == id) null else id
            filter(current.query, next)
        }
    }

    fun clearFilters() {
        _uiState.value = filter("", null)
    }

    private fun filter(query: String, category: String?): ExploreUiState {
        val (destinations, places) = filterCatalog(catalog, query, category)
        return ExploreUiState(
            query = query,
            category = category,
            destinations = destinations,
            places = places,
            destinationNames = catalog.destinations().associate { it.id to it.name },
            fallbackImageUrl = catalog.fallbackImageUrl(),
            empty = destinations.isEmpty() && places.isEmpty(),
        )
    }
}

fun filterCatalog(
    catalog: CatalogRepository,
    query: String,
    category: String?,
): Pair<List<Destination>, List<Place>> {
    val trimmed = query.trim()
    val destinations = catalog.destinations().filter { destination ->
        matchesQuery(destination, trimmed) && matchesCategory(destination, category)
    }
    val matchingPlaces = catalog.places().filter { place ->
        matchesQuery(place, trimmed) && matchesCategory(place, category)
    }
    val places = if (trimmed.isEmpty() && category == null) {
        matchingPlaces.filter { it.popular } + matchingPlaces.filterNot { it.popular }
    } else {
        matchingPlaces
    }
    return destinations to places
}

private fun matchesQuery(destination: Destination, query: String): Boolean {
    if (query.isEmpty()) return true
    val haystack = listOf(destination.name, destination.country, destination.tagline, destination.description)
        .joinToString(" ")
        .lowercase()
    return haystack.contains(query.lowercase())
}

private fun matchesQuery(place: Place, query: String): Boolean {
    if (query.isEmpty()) return true
    val haystack = listOf(place.name, place.summary, place.description, place.location)
        .joinToString(" ")
        .lowercase()
    return haystack.contains(query.lowercase())
}

private fun matchesCategory(destination: Destination, category: String?): Boolean =
    category == null || destination.categories.contains(category)

private fun matchesCategory(place: Place, category: String?): Boolean =
    category == null || place.category == category
