package app.features.cart

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.CatalogRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** One product in the cart and its quantity (always 1 or more). */
@Serializable
data class CartLine(val productId: String, val quantity: Int)

/**
 * The cart for the whole app. AppContainer holds a single instance, so every screen observes the same cart.
 */
interface CartRepository {
    /** The lines, in the order products were first added. */
    val lines: Flow<List<CartLine>>

    /** The product's quantity, or 0. */
    suspend fun quantity(productId: String): Int = lines.first().firstOrNull { it.productId == productId }?.quantity ?: 0

    /** +1; a new product is appended with quantity 1. */
    suspend fun add(productId: String)

    /** −1; at 0 the line is removed. Does nothing for a product that isn't in the cart. */
    suspend fun remove(productId: String)

    suspend fun clear()
}

/** The cart's rules, shared by every implementation. */
object CartLines {
    /** Storage key, shared with the iOS and web apps. */
    const val STORAGE_KEY = "cart.items"

    private val json = Json { ignoreUnknownKeys = true }

    fun add(lines: List<CartLine>, productId: String): List<CartLine> =
        if (lines.any { it.productId == productId }) {
            lines.map { if (it.productId == productId) it.copy(quantity = it.quantity + 1) else it }
        } else {
            lines + CartLine(productId, 1)
        }

    fun remove(lines: List<CartLine>, productId: String): List<CartLine> =
        lines.mapNotNull { line ->
            when {
                line.productId != productId -> line
                line.quantity > 1 -> line.copy(quantity = line.quantity - 1)
                else -> null
            }
        }

    fun encode(lines: List<CartLine>): String = json.encodeToString(lines)

    /**
     * Drops lines for products not in the catalog and quantities below 1, then merges duplicate lines for one
     * product into the first one, adding their quantities. Unreadable data is an empty cart.
     */
    fun decode(stored: String?, catalog: CatalogRepository): List<CartLine> {
        if (stored.isNullOrBlank()) return emptyList()
        val decoded = try {
            json.decodeFromString<List<CartLine>>(stored)
        } catch (_: Exception) {
            return emptyList()
        }
        val valid = decoded.filter { it.quantity >= 1 && catalog.product(it.productId) != null }
        return merge(valid)
    }

    /** One line per product, at the position of its first line, with the quantities added. */
    fun merge(lines: List<CartLine>): List<CartLine> {
        val merged = LinkedHashMap<String, Int>()
        for (line in lines) merged[line.productId] = (merged[line.productId] ?: 0) + line.quantity
        return merged.map { (productId, quantity) -> CartLine(productId, quantity) }
    }
}

/** Keeps the cart in Jetpack DataStore under `cart.items`, as JSON. */
class DataStoreCartRepository(
    private val dataStore: DataStore<Preferences>,
    private val catalog: CatalogRepository,
) : CartRepository {
    override val lines: Flow<List<CartLine>> = dataStore.data.map { CartLines.decode(it[key], catalog) }

    override suspend fun add(productId: String) = update { CartLines.add(it, productId) }

    override suspend fun remove(productId: String) = update { CartLines.remove(it, productId) }

    override suspend fun clear() = update { emptyList() }

    private suspend fun update(transform: (List<CartLine>) -> List<CartLine>) {
        dataStore.edit { prefs -> prefs[key] = CartLines.encode(transform(CartLines.decode(prefs[key], catalog))) }
    }

    private companion object {
        val key = stringPreferencesKey(CartLines.STORAGE_KEY)
    }
}

/** Keeps the cart in memory, for previews and tests. */
class InMemoryCartRepository(initial: List<CartLine> = emptyList()) : CartRepository {
    private val state = MutableStateFlow(initial)

    override val lines: Flow<List<CartLine>> = state

    override suspend fun add(productId: String) = state.update { CartLines.add(it, productId) }

    override suspend fun remove(productId: String) = state.update { CartLines.remove(it, productId) }

    override suspend fun clear() {
        state.value = emptyList()
    }
}
