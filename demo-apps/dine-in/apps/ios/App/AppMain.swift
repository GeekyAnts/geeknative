import SwiftUI

@main
struct AppMain: App {
    @State private var container: AppContainer

    init() {
        AppFonts.register()
        AppSerif.register()
        URLCache.configureForPhotography()
        _container = State(initialValue: AppContainer.live())
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
