package app.features.explore

import app.features.catalog.CollectionId
import app.features.catalog.CuisineId

/**
 * Opening Explore from Discover with a query, cuisine or collection, which replaces Explore's
 * filters. [id] makes each request distinct, so tapping the same chip twice applies it twice.
 */
data class ExploreRequest(
    val query: String? = null,
    val cuisine: CuisineId? = null,
    val collection: CollectionId? = null,
    val focusSearch: Boolean = false,
    val id: Long = System.nanoTime(),
) {
    fun toFilters(): ExploreFilters = ExploreFilters(
        query = query.orEmpty(),
        cuisines = setOfNotNull(cuisine),
        collection = collection,
    )
}
