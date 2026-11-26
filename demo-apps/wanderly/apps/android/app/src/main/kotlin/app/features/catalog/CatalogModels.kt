package app.features.catalog

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import app.R
import app.generated.AppIcons
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

val CatalogJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

@Serializable
data class Catalog(
    val fallbackImageUrl: String = "",
    val inspirationDestinationIds: List<String> = emptyList(),
    val destinations: List<Destination> = emptyList(),
    val places: List<Place> = emptyList(),
) {
    companion object {
        val EMPTY = Catalog()
    }
}

@Serializable
data class Destination(
    val id: String,
    val name: String,
    val country: String,
    val tagline: String,
    val description: String,
    val imageUrl: String,
    val gallery: List<String> = emptyList(),
    val categories: List<String> = emptyList(),
    val trending: Boolean = false,
    val featured: Boolean = false,
    val bestTimeToVisit: String = "",
    val currency: String = "",
    val currencySymbol: String = "",
    val language: String = "",
    val weather: Weather = Weather(),
    val travelTips: List<String> = emptyList(),
    val budgetEstimates: Map<String, BudgetEstimate> = emptyMap(),
    val itineraryTemplates: List<ItineraryTemplate> = emptyList(),
)

@Serializable
data class Weather(
    val summary: String = "",
    val tempC: Int = 0,
    val season: String = "",
)

@Serializable
data class BudgetEstimate(
    val lodging: Int,
    val food: Int,
    val activities: Int,
)

@Serializable
data class ItineraryTemplate(
    val title: String = "",
    val items: List<TemplateItem> = emptyList(),
)

@Serializable
data class TemplateItem(
    val placeId: String,
    val startTime: String,
    val durationMinutes: Int,
)

@Serializable
data class Place(
    val id: String,
    val destinationId: String,
    val kind: String,
    val name: String,
    val summary: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val gallery: List<String> = emptyList(),
    val location: String = "",
    val category: String = "",
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val openingHours: String = "",
    val durationMinutes: Int = 0,
    val priceLevel: Int = 0,
    val popular: Boolean = false,
    val pricePerNight: Int? = null,
)

enum class TravelCategory(val id: String, @StringRes val label: Int) {
    Beaches("beaches", R.string.category_beaches),
    Mountains("mountains", R.string.category_mountains),
    Adventure("adventure", R.string.category_adventure),
    History("history", R.string.category_history),
    Food("food", R.string.category_food);

    companion object {
        fun fromId(id: String): TravelCategory? = entries.firstOrNull { it.id == id }
    }
}

@Composable
fun TravelCategory.icon(): ImageVector = when (this) {
    TravelCategory.Beaches -> AppIcons.waves
    TravelCategory.Mountains -> AppIcons.mountain
    TravelCategory.Adventure -> AppIcons.sparkles
    TravelCategory.History -> AppIcons.landmark
    TravelCategory.Food -> AppIcons.utensils
}

enum class PlaceKind(val id: String, @StringRes val label: Int) {
    Destination("destination", R.string.kind_destination),
    Attraction("attraction", R.string.kind_attraction),
    Hotel("hotel", R.string.kind_hotel),
    Restaurant("restaurant", R.string.kind_restaurant),
    Activity("activity", R.string.kind_activity);

    companion object {
        fun fromId(id: String): PlaceKind = entries.firstOrNull { it.id == id } ?: Attraction
    }
}
