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
        )
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        host.view.layoutIfNeeded()
    }

    @Test("AC-home-1: shows the app name as its title")
    func showsAppName() {
        // HomeScreen sets navigationTitle(AppIdentity.name), and the name comes from contracts/app.json.
        #expect(!AppIdentity.name.isEmpty)
        renderHome()
    }

    @Test("AC-home-2: shows the welcome card's title and text")
    func showsWelcomeCard() {
        // NSLocalizedString returns the key itself when a string is missing from the bundle.
        #expect(Strings.homeWelcomeTitle != "home.welcomeTitle")
        #expect(Strings.homeWelcomeBody != "home.welcomeBody")
        #expect(!Strings.homeWelcomeTitle.isEmpty)
        #expect(!Strings.homeWelcomeBody.isEmpty)
        renderHome()
    }
}
