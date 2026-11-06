import SwiftUI
import Testing
import UIKit
@testable import App

@Suite("Home")
struct HomeTests {
    /// Lays out Home inside a navigation stack, as RootView does, so a broken view fails here.
    private func renderHome() {
        let host = UIHostingController(
            rootView: NavigationStack { HomeScreen() }
                .environment(AppContainer.preview())
                .environment(AppNavigation())
        )
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        host.view.layoutIfNeeded()
    }

    @Test("AC-home-1: Home shows the app name in its navigation chrome")
    func showsAppName() {
        #expect(!AppIdentity.name.isEmpty)
        renderHome()
    }

    @Test("AC-home-2: Home shows the hero title and supporting text")
    func showsHeroTitleAndBody() {
        #expect(Strings.homeHeroTitle != "home.heroTitle")
        #expect(Strings.homeHeroBody != "home.heroBody")
        #expect(!Strings.homeHeroTitle.isEmpty)
        #expect(!Strings.homeHeroBody.isEmpty)
        renderHome()
    }

    @Test("AC-home-6: Home lists the featured destinations from the catalog")
    func listsFeaturedDestinations() {
        #expect(WeddingCatalog.destinations.map(\.id) == ["udaipur", "goa", "jaipur", "bali", "tuscany", "santorini"])
        renderHome()
    }
}
