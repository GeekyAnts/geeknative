import Foundation
import SwiftUI
import UIKit

@main
struct AppMain: App {
    @State private var container = AppContainer.live()

    init() {
        AppFonts.register()
        if ProcessInfo.processInfo.arguments.contains("--uitesting") {
            UIView.setAnimationsEnabled(false)
            let defaults = UserDefaults.standard
            defaults.removeObject(forKey: SavedStorage.key)
            defaults.removeObject(forKey: TripStorage.key)
            defaults.removeObject(forKey: ProfileStorage.key)
            defaults.removeObject(forKey: Appearance.storageKey)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
