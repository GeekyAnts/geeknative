import SwiftUI

@main
struct AppMain: App {
    @State private var container = AppContainer.live()

    init() {
        AppFonts.register()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
