package app.features.order

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.cart.CartLine
import app.features.cart.CartSummary
import app.features.catalog.CatalogRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** A product as it was when ordered, so the order reads the same if the catalog changes. */
@Serializable
data class OrderLine(
    val productId: String,
    val name: String,
    val unit: String,
    val emoji: String,
    val categoryId: String,
    val price: Int,
    val mrp: Int,
    val quantity: Int,
) {
    val lineTotal: Int get() = price * quantity
}

/** A placed cart. Field names are the stored JSON's, the same on every platform. */
@Serializable
data class Order(
    val id: String,
    val placedAt: Long,
    val lines: List<OrderLine>,
    val itemCount: Int,
    val itemTotal: Int,
    val savings: Int,
    val deliveryFee: Int,
    val toPay: Int,
) {
    companion object {
        /** `MN` followed by `placedAt % 1000000`, zero-padded to 6 digits. */
        fun idFor(placedAt: Long): String = "MN" + (placedAt % 1_000_000).toString().padStart(6, '0')

        /** Builds an order from the cart's lines and summary at [placedAt]. Lines for unknown products are skipped. */
        fun place(lines: List<CartLine>, catalog: CatalogRepository, placedAt: Long): Order {
            val summary = CartSummary.of(lines, catalog)
            return Order(
                id = idFor(placedAt),
                placedAt = placedAt,
                lines = lines.mapNotNull { line ->
                    catalog.product(line.productId)?.let {
                        OrderLine(it.id, it.name, it.unit, it.emoji, it.categoryId, it.price, it.mrp, line.quantity)
                    }
                },
                itemCount = summary.itemCount,
                itemTotal = summary.itemTotal,
                savings = summary.savings,
                deliveryFee = summary.deliveryFee,
                toPay = summary.toPay,
            )
        }
    }
}

/** Placed orders, newest first. */
interface OrdersRepository {
    suspend fun save(order: Order)

    suspend fun order(id: String): Order?
}

/** The history's rules, shared by every implementation. */
object OrderHistory {
    /** Storage key, shared with the iOS and web apps. */
    const val STORAGE_KEY = "orders.history"
    const val LIMIT = 20

    private val json = Json { ignoreUnknownKeys = true }

    fun prepend(history: List<Order>, order: Order): List<Order> =
        (listOf(order) + history.filterNot { it.id == order.id }).take(LIMIT)

    fun encode(history: List<Order>): String = json.encodeToString(history)

    /** Unreadable data counts as no orders. */
    fun decode(stored: String?): List<Order> {
        if (stored.isNullOrBlank()) return emptyList()
        return try {
            json.decodeFromString<List<Order>>(stored)
        } catch (_: Exception) {
            emptyList()
        }
    }
}

/** Keeps orders in Jetpack DataStore under `orders.history`, as JSON. */
class DataStoreOrdersRepository(private val dataStore: DataStore<Preferences>) : OrdersRepository {
    private val history = dataStore.data.map { OrderHistory.decode(it[key]) }

    override suspend fun save(order: Order) {
        dataStore.edit { it[key] = OrderHistory.encode(OrderHistory.prepend(OrderHistory.decode(it[key]), order)) }
    }

    override suspend fun order(id: String): Order? = history.first().firstOrNull { it.id == id }

    private companion object {
        val key = stringPreferencesKey(OrderHistory.STORAGE_KEY)
    }
}

/** Keeps orders in memory, for previews and tests. */
class InMemoryOrdersRepository(initial: List<Order> = emptyList()) : OrdersRepository {
    private val state = MutableStateFlow(initial)

    val orders: List<Order> get() = state.value

    override suspend fun save(order: Order) = state.update { OrderHistory.prepend(it, order) }

    override suspend fun order(id: String): Order? = state.value.firstOrNull { it.id == id }
}
