package app.features.catalog

import android.content.Context

/** Bundled destinations, places and templates. Local and synchronous after load. */
interface CatalogRepository {
    fun catalogOrNull(): Catalog?
    fun retry()
    fun destinations(): List<Destination> = catalogOrNull()?.destinations.orEmpty()
    fun places(): List<Place> = catalogOrNull()?.places.orEmpty()
    fun destination(id: String): Destination? = destinations().firstOrNull { it.id == id }
    fun place(id: String): Place? = places().firstOrNull { it.id == id }
    fun featured(): Destination? = destinations().firstOrNull { it.featured }
    fun trending(): List<Destination> = destinations().filter { it.trending }
    fun popularPlaces(): List<Place> = places().filter { it.popular }
    fun inspiration(): List<Destination> {
        val catalog = catalogOrNull() ?: return emptyList()
        return catalog.inspirationDestinationIds.mapNotNull { destination(it) }
    }
    fun fallbackImageUrl(): String = catalogOrNull()?.fallbackImageUrl.orEmpty()
    fun placesFor(destinationId: String, kind: String): List<Place> =
        places().filter { it.destinationId == destinationId && it.kind == kind }
}

class AssetCatalogRepository(private val context: Context) : CatalogRepository {
    private var cached: Catalog? = load()

    override fun catalogOrNull(): Catalog? = cached

    override fun retry() {
        cached = load()
    }

    private fun load(): Catalog? = try {
        context.assets.open("catalog.json").bufferedReader().use { reader ->
            CatalogJson.decodeFromString(Catalog.serializer(), reader.readText())
        }
    } catch (_: Exception) {
        null
    }
}

class InMemoryCatalogRepository(private val catalog: Catalog? = Catalog.EMPTY) : CatalogRepository {
    override fun catalogOrNull(): Catalog? = catalog

    override fun retry() = Unit
}

fun decodeCatalog(json: String): Catalog =
    CatalogJson.decodeFromString(Catalog.serializer(), json)
