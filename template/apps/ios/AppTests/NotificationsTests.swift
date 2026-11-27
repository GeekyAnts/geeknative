import Foundation
import Testing
@testable import App

@Suite("Notifications")
struct NotificationsTests {
    private func withFreshDefaults(_ body: (UserDefaults) -> Void) {
        let name = "NotificationsTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        body(defaults)
    }

    private func note(id: String, createdAt: String, readAt: String? = nil, deliverAt: String? = nil) -> AppNotification {
        AppNotification(
            id: id,
            kind: "reminder",
            title: id,
            body: "body",
            createdAt: createdAt,
            readAt: readAt,
            route: nil,
            routeParams: [:],
            deliverAt: deliverAt,
            deliveredAt: nil
        )
    }

    private final class RecordingPresenter: NotificationPresenter {
        var ids: [String] = []
        func present(_ notification: AppNotification) { ids.append(notification.id) }
    }

    private final class MemoryGateway: NotificationGateway {
        var items: [AppNotification]
        init(_ items: [AppNotification]) { self.items = items }
        func list() -> [AppNotification] { items }
        func save(_ notification: AppNotification) {
            items.removeAll { $0.id == notification.id }
            items.append(notification)
        }
        func remove(id: String) { items.removeAll { $0.id == id } }
    }

    @Test("delivery defaults to off and the inbox is empty")
    func defaultsOff() {
        withFreshDefaults { defaults in
            let repository = UserDefaultsNotificationsRepository(defaults: defaults)
            #expect(repository.enabled == false)
            #expect(repository.list().isEmpty)
        }
    }

    @Test("lists unread first, then newest")
    func sortOrder() {
        let repository = InMemoryNotificationsRepository()
        repository.upsert(note(id: "old-unread", createdAt: "2026-01-01T00:00:00Z"))
        repository.upsert(note(id: "new-read", createdAt: "2026-03-01T00:00:00Z", readAt: "2026-03-02T00:00:00Z"))
        repository.upsert(note(id: "new-unread", createdAt: "2026-02-01T00:00:00Z"))
        #expect(repository.list().map(\.id) == ["new-unread", "old-unread", "new-read"])
    }

    @Test("mark read does not move the first timestamp, and dismiss removes the row")
    func markAndDismiss() {
        let repository = InMemoryNotificationsRepository(items: [
            note(id: "a", createdAt: "2026-01-01T00:00:00Z"),
            note(id: "b", createdAt: "2026-01-02T00:00:00Z"),
        ])
        repository.markRead(id: "a", readAt: "2026-01-03T00:00:00Z")
        repository.markRead(id: "a", readAt: "2026-01-04T00:00:00Z")
        #expect(repository.list().first { $0.id == "a" }?.readAt == "2026-01-03T00:00:00Z")
        repository.markAllRead(readAt: "2026-01-05T00:00:00Z")
        #expect(repository.list().allSatisfy { $0.readAt != nil })
        repository.dismiss(id: "b")
        #expect(repository.list().map(\.id) == ["a"])
    }

    @Test("the local inbox survives a new repository on the same defaults")
    func survivesRestart() {
        withFreshDefaults { defaults in
            var item = note(id: "kept", createdAt: "2026-01-01T00:00:00Z")
            item.route = "home"
            item.routeParams = ["tab": "saved"]
            let first = UserDefaultsNotificationsRepository(defaults: defaults)
            first.upsert(item)
            first.setEnabled(true)
            let again = UserDefaultsNotificationsRepository(defaults: defaults)
            #expect(again.enabled)
            #expect(again.list().first?.routeParams == ["tab": "saved"])
        }
    }

    @Test("presents a due notification once, and stays quiet when delivery is off")
    func deliverOnce() {
        withFreshDefaults { defaults in
            let repository = UserDefaultsNotificationsRepository(defaults: defaults)
            repository.upsert(note(id: "due", createdAt: "2026-01-01T00:00:00Z", deliverAt: "2026-01-02T00:00:00Z"))
            let early = RecordingPresenter()
            repository.deliverDue(now: "2026-01-01T00:00:00Z", presenter: early)
            #expect(early.ids.isEmpty)

            repository.setEnabled(true)
            let presented = RecordingPresenter()
            repository.deliverDue(now: "2026-01-02T00:00:00Z", presenter: presented)
            repository.deliverDue(now: "2026-01-03T00:00:00Z", presenter: presented)
            #expect(presented.ids == ["due"])
            #expect(repository.list().first?.deliveredAt == "2026-01-02T00:00:00Z")
        }
    }

    @Test("a remote inbox uses the gateway and keeps the preference on the device")
    func remoteGateway() {
        withFreshDefaults { defaults in
            let preferences = UserDefaultsNotificationsRepository(defaults: defaults)
            let gateway = MemoryGateway([note(id: "server", createdAt: "2026-01-01T00:00:00Z", deliverAt: "2026-01-02T00:00:00Z")])
            let repository = RemoteNotificationsRepository(gateway: gateway, preferences: preferences)
            #expect(repository.enabled == false)
            repository.setEnabled(true)
            #expect(preferences.enabled)
            let presented = RecordingPresenter()
            repository.deliverDue(now: "2026-01-02T00:00:00Z", presenter: presented)
            #expect(presented.ids == ["server"])
            #expect(gateway.list().first?.deliveredAt == "2026-01-02T00:00:00Z")
            repository.dismiss(id: "server")
            #expect(repository.list().isEmpty)
        }
    }
}
