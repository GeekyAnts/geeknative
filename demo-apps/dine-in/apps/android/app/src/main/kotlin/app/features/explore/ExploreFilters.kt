package app.features.explore

import androidx.annotation.StringRes
import app.R
import app.features.catalog.CollectionId
import app.features.catalog.CuisineId
import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import app.features.catalog.SearchText
import app.features.catalog.TodayAvailability
import java.time.LocalDateTime

data class ExploreFilters(
    val query: String = "",
    val cuisines: Set<CuisineId> = emptySet(),
    val neighbourhoods: Set<String> = emptySet(),
    val priceLevels: Set<Int> = emptySet(),
    val minRating: Double? = null,
    val availableToday: Boolean = false,
    val collection: CollectionId? = null,
) {
    /** The badge count: the query isn't counted. */
    val activeCount: Int
        get() = listOf(cuisines.isNotEmpty(), neighbourhoods.isNotEmpty(), priceLevels.isNotEmpty(), minRating != null, availableToday, collection != null)
            .count { it }

    /** Everything except the query is cleared. */
    fun cleared(): ExploreFilters = ExploreFilters(query = query)

    companion object {
        val RATING_OPTIONS = listOf(4.5, 4.7, 4.8)
        val PRICE_LEVELS = 1..4
    }
}

enum class ExploreSort(val id: String, @StringRes val label: Int) {
    Popularity("popularity", R.string.explore_sort_popularity),
    Rating("rating", R.string.explore_sort_rating),
    Distance("distance", R.string.explore_sort_distance),
}

/** Filtering and sorting rules (spec/features/explore.md). [label] looks up a string resource. */
object ExploreSearch {
    fun matches(restaurant: Restaurant, filters: ExploreFilters, now: LocalDateTime, label: (Int) -> String): Boolean {
        if (filters.query.isNotBlank()) {
            val texts = buildList {
                add(restaurant.name)
                add(label(restaurant.cuisine.label))
                add(restaurant.neighbourhood)
                add(restaurant.tagline)
                restaurant.collections.forEach { add(label(it.title)) }
                restaurant.amenities.forEach { add(label(it.label)) }
            }
            if (texts.none { SearchText.matches(it, filters.query) }) return false
        }
        if (filters.cuisines.isNotEmpty() && restaurant.cuisine !in filters.cuisines) return false
        if (filters.neighbourhoods.isNotEmpty() && restaurant.neighbourhood !in filters.neighbourhoods) return false
        if (filters.priceLevels.isNotEmpty() && restaurant.priceLevel !in filters.priceLevels) return false
        if (filters.minRating != null && restaurant.rating < filters.minRating) return false
        if (filters.availableToday && DemoAvailability.today(restaurant, now) != TodayAvailability.Available) return false
        if (filters.collection != null && filters.collection !in restaurant.collections) return false
        return true
    }

    /** Ties keep catalog order (sortedWith is stable). */
    fun sort(restaurants: List<Restaurant>, sort: ExploreSort): List<Restaurant> = when (sort) {
        ExploreSort.Popularity -> restaurants.sortedByDescending { it.reviewCount }
        ExploreSort.Rating -> restaurants.sortedWith(compareByDescending<Restaurant> { it.rating }.thenByDescending { it.reviewCount })
        ExploreSort.Distance -> restaurants.sortedBy { it.distanceKm }
    }

    fun results(
        restaurants: List<Restaurant>,
        filters: ExploreFilters,
        sort: ExploreSort,
        now: LocalDateTime,
        label: (Int) -> String,
    ): List<Restaurant> = sort(restaurants.filter { matches(it, filters, now, label) }, sort)

    /** Distinct catalog neighbourhoods, sorted alphabetically. */
    fun neighbourhoods(restaurants: List<Restaurant>): List<String> = restaurants.map { it.neighbourhood }.distinct().sorted()
}
