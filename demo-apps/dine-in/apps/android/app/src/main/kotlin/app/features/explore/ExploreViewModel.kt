package app.features.explore

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import app.features.catalog.TodayAvailability
import app.features.saved.SavedRepository
import java.time.Clock
import java.time.LocalDateTime
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** What the member has set on Explore, before it is combined with the catalog. */
data class ExploreControls(
    /** The search field's text; it reaches [filters] after the debounce. */
    val queryText: String = "",
    val filters: ExploreFilters = ExploreFilters(),
    val sort: ExploreSort = ExploreSort.Popularity,
    /** The filters sheet's unapplied changes; null when the sheet is closed. */
    val draft: ExploreFilters? = null,
    /** Set when Explore should focus its search field (arriving from Discover's search bar). */
    val focusRequest: Long? = null,
)

data class ExploreUiState(
    val loading: Boolean = true,
    val failed: Boolean = false,
    val controls: ExploreControls = ExploreControls(),
    val viewMode: ExploreViewMode = ExploreViewMode.List,
    val results: List<Restaurant> = emptyList(),
    val featured: List<Restaurant> = emptyList(),
    val neighbourhoods: List<String> = emptyList(),
    val savedIds: Set<String> = emptySet(),
    val availability: Map<String, TodayAvailability> = emptyMap(),
    /** Live result count for the filters sheet's apply button. */
    val draftCount: Int = 0,
) {
    val filters: ExploreFilters get() = controls.filters

    /** The featured row shows only with no search text and no filters. */
    val showFeatured: Boolean get() = filters.query.isBlank() && filters.activeCount == 0 && featured.isNotEmpty()
}

@OptIn(FlowPreview::class)
class ExploreViewModel(
    catalog: CatalogRepository,
    private val saved: SavedRepository,
    private val repository: ExploreRepository,
    private val clock: Clock,
    private val label: (Int) -> String,
) : ViewModel() {
    private val loader = CatalogLoader(catalog)
    private val controls = MutableStateFlow(ExploreControls())

    val uiState: StateFlow<ExploreUiState> = combine(loader.state, controls, repository.viewMode, saved.savedIds) { load, controls, mode, savedIds ->
        val now = LocalDateTime.now(clock)
        when (load) {
            CatalogLoad.Loading -> ExploreUiState(loading = true, controls = controls, viewMode = mode)
            CatalogLoad.Failed -> ExploreUiState(loading = false, failed = true, controls = controls, viewMode = mode)
            is CatalogLoad.Loaded -> {
                val restaurants = load.catalog.restaurants
                ExploreUiState(
                    loading = false,
                    controls = controls,
                    viewMode = mode,
                    results = ExploreSearch.results(restaurants, controls.filters, controls.sort, now, label),
                    featured = restaurants.filter { it.featured },
                    neighbourhoods = ExploreSearch.neighbourhoods(restaurants),
                    savedIds = savedIds.toSet(),
                    availability = restaurants.associate { it.id to DemoAvailability.today(it, now) },
                    draftCount = controls.draft?.let { draft -> restaurants.count { ExploreSearch.matches(it, draft, now, label) } } ?: 0,
                )
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ExploreUiState())

    init {
        controls.map { it.queryText }
            .distinctUntilChanged()
            .drop(1)
            .debounce(SEARCH_DEBOUNCE_MILLIS)
            .onEach { text -> controls.update { it.copy(filters = it.filters.copy(query = text)) } }
            .launchIn(viewModelScope)
    }

    fun setQuery(text: String) = controls.update { it.copy(queryText = text) }

    fun clearQuery() = controls.update { it.copy(queryText = "", filters = it.filters.copy(query = "")) }

    fun setSort(sort: ExploreSort) = controls.update { it.copy(sort = sort) }

    fun toggleViewMode() {
        val next = if (uiState.value.viewMode == ExploreViewMode.List) ExploreViewMode.Grid else ExploreViewMode.List
        viewModelScope.launch { repository.setViewMode(next) }
    }

    fun toggleAvailableToday() = editFilters { copy(availableToday = !availableToday) }

    fun toggleCuisine(cuisine: app.features.catalog.CuisineId) =
        editFilters { copy(cuisines = if (cuisine in cuisines) cuisines - cuisine else cuisines + cuisine) }

    fun removeCollection() = editFilters { copy(collection = null) }

    fun clearFilters() = editFilters { cleared() }

    /** Replaces the filters with just the request's query, cuisine or collection (arriving from Discover). */
    fun apply(request: ExploreRequest) = controls.update {
        it.copy(
            queryText = request.query.orEmpty(),
            filters = request.toFilters(),
            draft = null,
            focusRequest = if (request.focusSearch) request.id else null,
        )
    }

    fun consumeFocusRequest() = controls.update { it.copy(focusRequest = null) }

    fun openFilters() = controls.update { it.copy(draft = it.filters) }

    fun editDraft(change: ExploreFilters.() -> ExploreFilters) = controls.update { it.copy(draft = it.draft?.change()) }

    /** Applies the sheet's changes and closes it. */
    fun applyDraft() = controls.update { it.copy(filters = it.draft ?: it.filters, draft = null) }

    /** Closes the sheet, discarding its changes. */
    fun dismissDraft() = controls.update { it.copy(draft = null) }

    fun toggleSaved(restaurantId: String) {
        viewModelScope.launch { saved.toggle(restaurantId) }
    }

    fun retry() = loader.retry()

    private fun editFilters(change: ExploreFilters.() -> ExploreFilters) = controls.update { it.copy(filters = it.filters.change()) }

    companion object {
        const val SEARCH_DEBOUNCE_MILLIS = 200L
    }
}
