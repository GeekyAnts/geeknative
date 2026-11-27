import SwiftUI

@main
struct AppMain: App {
    @State private var container = AppContainer.live()

    init() {
        AppFonts.register()
        SystemNotificationScheduler.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
        }
    }
}
