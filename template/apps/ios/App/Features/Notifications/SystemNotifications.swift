import Foundation
import UIKit
import UserNotifications

extension Notification.Name {
    /// Posted when the user taps a system notification. `object` is the route string, or nil.
    static let notificationOpened = Notification.Name("notificationOpened")
}

/// Schedules local notifications. A banner is not shown while this app is in the foreground:
/// `willPresent` returns no options, and an immediate row is not scheduled until the app is inactive.
final class SystemNotificationScheduler: NSObject, NotificationScheduler, UNUserNotificationCenterDelegate {
    static let shared = SystemNotificationScheduler()

    private override init() {
        super.init()
    }

    /// Call once at launch, before the first frame, so a tap can open the app.
    func start() {
        UNUserNotificationCenter.current().delegate = self
    }

    func requestPermission(_ done: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, _ in
            DispatchQueue.main.async { done(granted) }
        }
    }

    func schedule(_ notification: AppNotification) {
        let content = UNMutableNotificationContent()
        content.title = notification.title
        content.body = notification.body
        content.sound = .default
        if let route = notification.route {
            content.userInfo = ["route": route]
        }
        let trigger = trigger(for: notification)
        // Immediate delivery while the app is on screen would be a second banner beside the open app.
        if trigger == nil && UIApplication.shared.applicationState == .active { return }
        let request = UNNotificationRequest(identifier: notification.id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    func cancel(id: String) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [id])
        center.removeDeliveredNotifications(withIdentifiers: [id])
    }

    func cancelAll() {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }

    /// A future `deliverAt` waits. Anything else is delivered as soon as the app is not active.
    private func trigger(for notification: AppNotification) -> UNNotificationTrigger? {
        guard let deliverAt = notification.deliverAt, let date = ISO8601DateFormatter().date(from: deliverAt) else { return nil }
        let interval = date.timeIntervalSinceNow
        guard interval > 0.5 else { return nil }
        return UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
    }

    /// The system only calls this while the app is in the foreground. Show nothing.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        []
    }

    /// A tap brings this app forward, then asks the root view to open the row's route.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let route = response.notification.request.content.userInfo["route"] as? String
        await MainActor.run {
            NotificationCenter.default.post(name: .notificationOpened, object: route)
        }
    }
}
