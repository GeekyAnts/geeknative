package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.cart.CartRepository
import app.features.cart.DataStoreCartRepository
import app.features.cart.InMemoryCartRepository
import app.features.catalog.CatalogRepository
import app.features.catalog.LocalCatalogRepository
import app.features.order.DataStoreOrdersRepository
import app.features.order.InMemoryOrdersRepository
import app.features.order.OrdersRepository
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository

private val Context.settingsDataStore by preferencesDataStore(name = "settings")
private val Context.cartDataStore by preferencesDataStore(name = "cart")
private val Context.ordersDataStore by preferencesDataStore(name = "orders")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 * [cartRepository] is a single app-wide instance, so every screen sees the same cart.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val catalogRepository: CatalogRepository,
    val cartRepository: CartRepository,
    val ordersRepository: OrdersRepository,
    /** The current time in milliseconds; placing an order stamps it. */
    val clock: () -> Long = System::currentTimeMillis,
    /** Set when launched for screenshot capture; navigation starts on that screen. */
    val screenshot: ScreenshotLaunch? = null,
) {
    companion object {
        fun live(context: Context): AppContainer {
            val app = context.applicationContext
            val catalog = LocalCatalogRepository()
            return AppContainer(
                settingsRepository = DataStoreSettingsRepository(app.settingsDataStore),
                catalogRepository = catalog,
                cartRepository = DataStoreCartRepository(app.cartDataStore, catalog),
                ordersRepository = DataStoreOrdersRepository(app.ordersDataStore),
            )
        }

        /** In-memory dependencies, for previews and tests. */
        fun preview(
            cartRepository: CartRepository = InMemoryCartRepository(),
            ordersRepository: OrdersRepository = InMemoryOrdersRepository(),
            clock: () -> Long = System::currentTimeMillis,
        ) = AppContainer(
            settingsRepository = InMemorySettingsRepository(),
            catalogRepository = LocalCatalogRepository(),
            cartRepository = cartRepository,
            ordersRepository = ordersRepository,
            clock = clock,
        )

        /** In-memory cart and order, seeded the same way as the web shots. */
        fun screenshot(launch: ScreenshotLaunch) = AppContainer(
            settingsRepository = InMemorySettingsRepository(launch.appearance),
            catalogRepository = LocalCatalogRepository(),
            cartRepository = InMemoryCartRepository(launch.cartLines()),
            ordersRepository = InMemoryOrdersRepository(listOf(launch.order())),
            screenshot = launch,
        )
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
