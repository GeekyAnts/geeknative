import Foundation

enum UITestFlags {
    static var isRunning: Bool {
        ProcessInfo.processInfo.environment["UI_TESTING"] == "1"
            || ProcessInfo.processInfo.arguments.contains("UI_TESTING")
    }
}
