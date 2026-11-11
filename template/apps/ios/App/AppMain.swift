import SwiftUI

@main
struct AppMain: App {
    @State private var container = AppContainer.live()

    init() {
        // Registers the shared typeface and applies token colors and that face to navigation chrome.
        AppFonts.register()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
