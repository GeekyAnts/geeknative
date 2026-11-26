import Foundation
import SwiftUI
import Testing
import UIKit
@testable import App

@Suite("Home")
struct HomeTests {
    private func makeViewModel() -> HomeViewModel {
        HomeViewModel(container: .preview())
    }

    private func renderHome() {
        let host = UIHostingController(
            rootView: NavigationStack { HomeScreen() }
                .environment(AppContainer.preview())
        )
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        host.view.layoutIfNeeded()
    }

    @Test("AC-home-1: Home shows a destination search field")
    func showsSearchField() {
        #expect(!Strings.homeSearchPlaceholder.isEmpty)
        #expect(Strings.homeSearchPlaceholder != "home.searchPlaceholder")
        let viewModel = makeViewModel()
        viewModel.query = "  Bali  "
        viewModel.submitSearch()
        #expect(viewModel.query.trimmingCharacters(in: .whitespacesAndNewlines) == "Bali")
        renderHome()
    }

    @Test("AC-home-2: Home shows the featured destination's photograph and name")
    func showsFeatured() {
        let featured = makeViewModel().featured
        #expect(featured?.id == "bali")
        #expect(featured?.name == "Bali")
        #expect(featured?.imageUrl.isEmpty == false)
        renderHome()
    }

    @Test("AC-home-4: Home lists Paris, Bali, Tokyo, Dubai, London, Rome and Singapore as trending destinations, in that order")
    func trendingOrder() {
        let ids = makeViewModel().trending.map(\.id)
        #expect(ids == ["paris", "bali", "tokyo", "dubai", "london", "rome", "singapore"])
    }

    @Test("AC-home-5: Home shows category chips for Beaches, Mountains, Adventure, History and Food")
    func categoryChips() {
        #expect(TravelCategory.allCases.map(\.rawValue) == ["beaches", "mountains", "adventure", "history", "food"])
        #expect(TravelCategory.beaches.label == Strings.categoryBeaches)
        #expect(TravelCategory.mountains.label == Strings.categoryMountains)
        #expect(TravelCategory.adventure.label == Strings.categoryAdventure)
        #expect(TravelCategory.history.label == Strings.categoryHistory)
        #expect(TravelCategory.food.label == Strings.categoryFood)
        renderHome()
    }

    @Test("AC-home-7: Home shows popular attractions with photographs and names")
    func popularAttractions() {
        let popular = makeViewModel().popular
        #expect(!popular.isEmpty)
        #expect(popular.allSatisfy { $0.popular && !$0.name.isEmpty && !$0.imageUrl.isEmpty })
        renderHome()
    }
}
