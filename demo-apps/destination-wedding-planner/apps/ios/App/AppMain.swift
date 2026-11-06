import SwiftUI
import UIKit

@main
struct AppMain: App {
    @State private var container = AppContainer.live()

    init() {
        AppFonts.register()
        if UITestFlags.isRunning {
            UIView.setAnimationsEnabled(false)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
