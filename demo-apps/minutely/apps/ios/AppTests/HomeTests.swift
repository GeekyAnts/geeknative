import SwiftUI
import Testing
import UIKit
@testable import App

@MainActor
@Suite("Home")
struct HomeTests {
    /// Lays out a screen inside a navigation stack, as RootView does, so a broken view fails here.
    private func render(_ view: some View, container: AppContainer) {
        let host = UIHostingController(rootView: NavigationStack { view }.environment(container))
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        host.view.layoutIfNeeded()
    }

    @Test("AC-home-1: shows the app name as its title")
    func showsAppName() {
        let container = AppContainer.preview()
        let viewModel = HomeViewModel(container: container)
        #expect(viewModel.title == AppIdentity.name)
        #expect(viewModel.title == "Minutely")
        render(HomeScreen(viewModel: viewModel), container: container)
    }

    @Test("AC-home-2: shows the delivery promise with the configured minutes and the address")
    func showsDeliveryPromise() {
        let viewModel = HomeViewModel(container: .preview())
        #expect(viewModel.deliveryPromise == Strings.commonDeliveryIn(minutes: AppConfig.deliveryMinutes))
        #expect(viewModel.deliveryPromise.contains(String(AppConfig.deliveryMinutes)))
        #expect(viewModel.deliveryAddress == Strings.commonDeliveryAddress)
        #expect(viewModel.deliveryAddress != "common.deliveryAddress")
    }

    @Test("AC-home-3: has an entry point that opens Settings")
    func opensSettings() {
        let container = AppContainer.preview()
        HomeViewModel(container: container).openSettings()
        #expect(container.router.path == [.settings])
    }

    @Test("AC-home-4: shows all 6 categories, and choosing one opens Category for it")
    func categories() {
        let container = AppContainer.preview()
        let viewModel = HomeViewModel(container: container)
        #expect(viewModel.categories.map(\.id) == ["fruits", "dairy", "snacks", "drinks", "household", "personal"])
        viewModel.openCategory("snacks")
        #expect(container.router.path == [.category(categoryId: "snacks")])
    }

    @Test("AC-home-5: shows the bestseller products as product cards")
    func bestsellers() {
        let container = AppContainer.preview()
        let viewModel = HomeViewModel(container: container)
        #expect(viewModel.bestsellers == container.catalogRepository.bestsellers())
        #expect(viewModel.bestsellers.count == 9)
    }

    @Test("AC-home-6: the search entry opens Search")
    func opensSearch() {
        let container = AppContainer.preview()
        HomeViewModel(container: container).openSearch()
        #expect(container.router.path == [.search])
    }

    @Test("AC-home-7: the Cart button opens Cart, and its badge shows the item count when not empty")
    func cartButton() {
        let container = AppContainer.preview()
        let viewModel = HomeViewModel(container: container)
        #expect(viewModel.cartBadge == nil)

        container.cartRepository.add("banana")
        container.cartRepository.add("banana")
        container.cartRepository.add("milk")
        #expect(viewModel.cartBadge == 3)

        viewModel.openCart()
        #expect(container.router.path == [.cart])
        render(HomeScreen(viewModel: viewModel), container: container)
    }

    @Test("Every screen lays out with and without data")
    func screensRender() {
        let container = AppContainer.preview(cart: [CartLine(productId: "banana", quantity: 2)])
        render(CategoryScreen(viewModel: CategoryViewModel(categoryId: "fruits", container: container)), container: container)
        render(SearchScreen(viewModel: SearchViewModel(container: container)), container: container)
        render(CartScreen(viewModel: CartViewModel(container: container)), container: container)
        render(CartScreen(viewModel: CartViewModel(container: .preview())), container: container)
        render(OrderPlacedScreen(viewModel: OrderPlacedViewModel(orderId: "MN000000", container: container)), container: container)
    }
}
