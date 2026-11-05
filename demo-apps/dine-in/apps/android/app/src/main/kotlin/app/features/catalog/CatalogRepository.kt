package app.features.catalog

import android.content.Context
import java.time.DayOfWeek
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** Reads the restaurant catalog. A backend later adds a RemoteCatalogRepository; nothing else changes. */
interface CatalogRepository {
    suspend fun load(): Catalog
}

/** Parses the bundled assets/catalog.json once and caches the result. */
class BundledCatalogRepository(private val context: Context) : CatalogRepository {
    private val mutex = Mutex()
    private var cached: Catalog? = null

    override suspend fun load(): Catalog = mutex.withLock {
        cached ?: withContext(Dispatchers.IO) {
            val text = context.assets.open(ASSET).bufferedReader().use { it.readText() }
            CatalogParser.parse(text)
        }.also { cached = it }
    }

    private companion object {
        const val ASSET = "catalog.json"
    }
}

/** A fixed catalog, for tests and previews. */
class InMemoryCatalogRepository(private val catalog: () -> Catalog) : CatalogRepository {
    constructor(catalog: Catalog) : this({ catalog })

    override suspend fun load(): Catalog = catalog()
}

/** Catalog JSON → model. Unknown enum values are skipped, so an older app keeps working with a newer catalog. */
object CatalogParser {
    private val json = Json { ignoreUnknownKeys = true }

    fun parse(text: String): Catalog {
        val file = json.decodeFromString(CatalogFile.serializer(), text)
        return Catalog(
            version = file.version,
            heroImage = file.heroImage,
            welcomeImage = file.welcomeImage,
            cuisines = file.cuisines.mapNotNull(CuisineId::fromId),
            collections = file.collections.mapNotNull { c -> CollectionId.fromId(c.id)?.let { Collection(it, c.image) } },
            restaurants = file.restaurants.mapNotNull { it.toModel() },
        )
    }

    private fun RestaurantFile.toModel(): Restaurant? {
        val cuisine = CuisineId.fromId(cuisine) ?: return null
        return Restaurant(
            id = id,
            name = name,
            cuisine = cuisine,
            neighbourhood = neighbourhood,
            address = address,
            phone = phone,
            latitude = latitude,
            longitude = longitude,
            distanceKm = distanceKm,
            rating = rating,
            reviewCount = reviewCount,
            priceLevel = priceLevel,
            costForTwo = costForTwo,
            tagline = tagline,
            about = about,
            ambience = ambience,
            dressCode = dressCode,
            featured = featured,
            collections = collections.mapNotNull(CollectionId::fromId),
            amenities = amenities.mapNotNull(AmenityId::fromId),
            seating = seating.mapNotNull(Seating::fromId),
            maxPartySize = maxPartySize,
            demandPercent = demandPercent,
            openingHours = DayOfWeek.entries.associateWith { day ->
                openingHours[day.key]?.let { OpeningHours(it.open, it.close) }
            },
            heroImage = heroImage,
            gallery = gallery,
            signatureDishes = signatureDishes.map { Dish(it.name, it.description, it.price, it.image) },
            menuHighlights = menuHighlights.map { MenuItem(it.name, it.description, it.price) },
            reviews = reviews.map { Review(it.author, it.rating, it.date, it.text) },
        )
    }
}

@Serializable
private class CatalogFile(
    val version: Int,
    val heroImage: String,
    val welcomeImage: String,
    val cuisines: List<String> = emptyList(),
    val collections: List<CollectionFile> = emptyList(),
    val restaurants: List<RestaurantFile> = emptyList(),
)

@Serializable
private class CollectionFile(val id: String, val image: String)

@Serializable
private class HoursFile(val open: String, val close: String)

@Serializable
private class DishFile(val name: String, val description: String, val price: Int, val image: String)

@Serializable
private class MenuItemFile(val name: String, val description: String, val price: Int)

@Serializable
private class ReviewFile(val author: String, val rating: Int, val date: String, val text: String)

@Serializable
private class RestaurantFile(
    val id: String,
    val name: String,
    val cuisine: String,
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
    val dressCode: String? = null,
    val featured: Boolean = false,
    val collections: List<String> = emptyList(),
    val amenities: List<String> = emptyList(),
    val seating: List<String> = emptyList(),
    val maxPartySize: Int,
    val demandPercent: Int,
    val openingHours: Map<String, HoursFile?> = emptyMap(),
    val heroImage: String,
    val gallery: List<String> = emptyList(),
    val signatureDishes: List<DishFile> = emptyList(),
    val menuHighlights: List<MenuItemFile> = emptyList(),
    val reviews: List<ReviewFile> = emptyList(),
)
