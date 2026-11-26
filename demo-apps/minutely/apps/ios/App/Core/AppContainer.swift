import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let catalogRepository: any CatalogRepository
    let cartRepository: any CartRepository
    let ordersRepository: any OrdersRepository
    let router: Router
    /// The current time in milliseconds since 1970. Injected so tests can fix order ids.
    @ObservationIgnored let clock: () -> Int

    init(
        settingsRepository: any SettingsRepository,
        catalogRepository: any CatalogRepository,
        cartRepository: any CartRepository,
        ordersRepository: any OrdersRepository,
        router: Router = Router(),
        clock: @escaping () -> Int = AppContainer.systemClock
    ) {
        self.settingsRepository = settingsRepository
        self.catalogRepository = catalogRepository
        self.cartRepository = cartRepository
        self.ordersRepository = ordersRepository
        self.router = router
        self.clock = clock
    }

    static func live() -> AppContainer {
        let catalog = LocalCatalogRepository()
        if ScreenshotLaunch.isCapturing {
            return AppContainer(
                settingsRepository: InMemorySettingsRepository(appearance: ScreenshotLaunch.appearance()),
                catalogRepository: catalog,
                cartRepository: InMemoryCartRepository(lines: ScreenshotLaunch.cartLines()),
                ordersRepository: InMemoryOrdersRepository(orders: [ScreenshotLaunch.order()]),
                router: Router(path: ScreenshotLaunch.path())
            )
        }
        return AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: .standard),
            catalogRepository: catalog,
            cartRepository: UserDefaultsCartRepository(defaults: .standard, catalog: catalog),
            ordersRepository: UserDefaultsOrdersRepository(defaults: .standard)
        )
    }

    /// In-memory dependencies, for previews and tests.
    static func preview(cart: [CartLine] = [], orders: [Order] = []) -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            catalogRepository: LocalCatalogRepository(),
            cartRepository: InMemoryCartRepository(lines: cart),
            ordersRepository: InMemoryOrdersRepository(orders: orders)
        )
    }

    /// The cart's totals right now. Reading it from a view tracks the cart's lines.
    var cartSummary: CartSummary {
        CartSummary(lines: cartRepository.lines, catalog: catalogRepository)
    }

    nonisolated static func systemClock() -> Int {
        Int((Date().timeIntervalSince1970 * 1000).rounded())
    }
}
