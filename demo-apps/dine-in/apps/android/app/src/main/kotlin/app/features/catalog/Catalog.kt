package app.features.catalog

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import app.R
import app.generated.AppIcons
import java.time.DayOfWeek

/** The bundled list of restaurants, cuisines and collections (spec/features/catalog.md). */
data class Catalog(
    val version: Int,
    val heroImage: String,
    val welcomeImage: String,
    val cuisines: List<CuisineId>,
    val collections: List<Collection>,
    val restaurants: List<Restaurant>,
) {
    fun restaurant(id: String): Restaurant? = restaurants.firstOrNull { it.id == id }
}

data class Collection(val id: CollectionId, val image: String)

data class OpeningHours(val open: String, val close: String)

data class Dish(val name: String, val description: String, val price: Int, val image: String)

data class MenuItem(val name: String, val description: String, val price: Int)

data class Review(val author: String, val rating: Int, val date: String, val text: String)

data class Restaurant(
    val id: String,
    val name: String,
    val cuisine: CuisineId,
    val neighbourhood: String,
    val address: String,
    val phone: String,
    val latitude: Double,
    val longitude: Double,
    val distanceKm: Double,
    val rating: Double,
    val reviewCount: Int,
    val priceLevel: Int,
    val costForTwo: Int,
    val tagline: String,
    val about: String,
    val ambience: String,
    val dressCode: String?,
    val featured: Boolean,
    val collections: List<CollectionId>,
    val amenities: List<AmenityId>,
    val seating: List<Seating>,
    val maxPartySize: Int,
    val demandPercent: Int,
    /** Keyed by day; a missing value means closed that day. */
    val openingHours: Map<DayOfWeek, OpeningHours?>,
    val heroImage: String,
    val gallery: List<String>,
    val signatureDishes: List<Dish>,
    val menuHighlights: List<MenuItem>,
    val reviews: List<Review>,
)

enum class CuisineId(val id: String, @StringRes val label: Int) {
    Italian("italian", R.string.cuisine_italian),
    Japanese("japanese", R.string.cuisine_japanese),
    Indian("indian", R.string.cuisine_indian),
    French("french", R.string.cuisine_french),
    Mediterranean("mediterranean", R.string.cuisine_mediterranean),
    Asian("asian", R.string.cuisine_asian),
    Continental("continental", R.string.cuisine_continental);

    companion object {
        fun fromId(id: String?): CuisineId? = entries.firstOrNull { it.id == id }
    }
}

enum class CollectionId(val id: String, @StringRes val title: Int, @StringRes val subtitle: Int) {
    MostLoved("mostLoved", R.string.collection_most_loved_title, R.string.collection_most_loved_subtitle),
    FineDining("fineDining", R.string.collection_fine_dining_title, R.string.collection_fine_dining_subtitle),
    Romantic("romantic", R.string.collection_romantic_title, R.string.collection_romantic_subtitle),
    Rooftop("rooftop", R.string.collection_rooftop_title, R.string.collection_rooftop_subtitle),
    HiddenGems("hiddenGems", R.string.collection_hidden_gems_title, R.string.collection_hidden_gems_subtitle),
    ChefsPicks("chefsPicks", R.string.collection_chefs_picks_title, R.string.collection_chefs_picks_subtitle);

    companion object {
        fun fromId(id: String?): CollectionId? = entries.firstOrNull { it.id == id }
    }
}

enum class AmenityId(val id: String, @StringRes val label: Int) {
    Valet("valet", R.string.amenity_valet),
    Sommelier("sommelier", R.string.amenity_sommelier),
    PrivateDining("privateDining", R.string.amenity_private_dining),
    LiveMusic("liveMusic", R.string.amenity_live_music),
    Rooftop("rooftop", R.string.amenity_rooftop),
    Accessible("accessible", R.string.amenity_accessible),
    Bar("bar", R.string.amenity_bar),
    ChefsTable("chefsTable", R.string.amenity_chefs_table),
    Garden("garden", R.string.amenity_garden),
    Wifi("wifi", R.string.amenity_wifi);

    val icon: ImageVector
        @Composable get() = when (this) {
            Valet -> AppIcons.amenityValet
            Sommelier -> AppIcons.amenitySommelier
            PrivateDining -> AppIcons.amenityPrivateDining
            LiveMusic -> AppIcons.amenityLiveMusic
            Rooftop -> AppIcons.amenityRooftop
            Accessible -> AppIcons.amenityAccessible
            Bar -> AppIcons.amenityBar
            ChefsTable -> AppIcons.amenityChefsTable
            Garden -> AppIcons.amenityGarden
            Wifi -> AppIcons.amenityWifi
        }

    companion object {
        fun fromId(id: String?): AmenityId? = entries.firstOrNull { it.id == id }
    }
}

enum class Seating(val id: String, @StringRes val label: Int) {
    Indoor("indoor", R.string.seating_indoor),
    Outdoor("outdoor", R.string.seating_outdoor),
    Window("window", R.string.seating_window),
    Private("private", R.string.seating_private);

    val icon: ImageVector
        @Composable get() = when (this) {
            Indoor -> AppIcons.seatingIndoor
            Outdoor -> AppIcons.seatingOutdoor
            Window -> AppIcons.seatingWindow
            Private -> AppIcons.seatingPrivate
        }

    companion object {
        fun fromId(id: String?): Seating? = entries.firstOrNull { it.id == id }
    }
}

enum class Occasion(val id: String, @StringRes val label: Int) {
    None("none", R.string.occasion_none),
    Birthday("birthday", R.string.occasion_birthday),
    Anniversary("anniversary", R.string.occasion_anniversary),
    Business("business", R.string.occasion_business),
    Date("date", R.string.occasion_date),
    Celebration("celebration", R.string.occasion_celebration);

    /** `none` has no icon. */
    val icon: ImageVector?
        @Composable get() = when (this) {
            None -> null
            Birthday -> AppIcons.occasionBirthday
            Anniversary -> AppIcons.occasionAnniversary
            Business -> AppIcons.occasionBusiness
            Date -> AppIcons.occasionDate
            Celebration -> AppIcons.occasionCelebration
        }

    companion object {
        fun fromId(id: String?): Occasion? = entries.firstOrNull { it.id == id }
    }
}

/** In the order listed in PRODUCT.md, which is also the stored order. */
enum class Dietary(val id: String, @StringRes val label: Int) {
    Vegetarian("vegetarian", R.string.dietary_vegetarian),
    Vegan("vegan", R.string.dietary_vegan),
    GlutenFree("glutenFree", R.string.dietary_gluten_free),
    DairyFree("dairyFree", R.string.dietary_dairy_free),
    NutAllergy("nutAllergy", R.string.dietary_nut_allergy),
    ShellfishAllergy("shellfishAllergy", R.string.dietary_shellfish_allergy);

    companion object {
        fun fromId(id: String?): Dietary? = entries.firstOrNull { it.id == id }
    }
}

/** Day keys used in the catalog and in test IDs (`restaurant.hours.<day>`). */
val DayOfWeek.key: String
    get() = when (this) {
        DayOfWeek.MONDAY -> "mon"
        DayOfWeek.TUESDAY -> "tue"
        DayOfWeek.WEDNESDAY -> "wed"
        DayOfWeek.THURSDAY -> "thu"
        DayOfWeek.FRIDAY -> "fri"
        DayOfWeek.SATURDAY -> "sat"
        DayOfWeek.SUNDAY -> "sun"
    }
