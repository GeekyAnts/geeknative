import Foundation

/// One inbox row. The JSON keys match Android and web.
struct AppNotification: Equatable {
    var id: String
    var kind: String
    var title: String
    var body: String
    var createdAt: String
    var readAt: String?
    var route: String?
    var routeParams: [String: String]
    var deliverAt: String?
    var deliveredAt: String?

    static let enabledKey = "notifications.enabled"
    static let inboxKey = "notifications.inbox"

    func jsonObject() -> [String: Any] {
        [
            "id": id,
            "kind": kind,
            "title": title,
            "body": body,
            "createdAt": createdAt,
            "readAt": readAt ?? NSNull(),
            "route": route ?? NSNull(),
            "routeParams": routeParams,
            "deliverAt": deliverAt ?? NSNull(),
            "deliveredAt": deliveredAt ?? NSNull(),
        ]
    }

    static func parse(_ value: Any) -> AppNotification? {
        guard let row = value as? [String: Any],
              let id = row["id"] as? String,
              let kind = row["kind"] as? String,
              let title = row["title"] as? String,
              let body = row["body"] as? String,
              let createdAt = row["createdAt"] as? String
        else { return nil }
        let params: [String: String]
        if row["routeParams"] == nil || row["routeParams"] is NSNull {
            params = [:]
        } else if let dict = row["routeParams"] as? [String: Any] {
            var converted: [String: String] = [:]
            for (key, value) in dict {
                guard let value = value as? String else { return nil }
                converted[key] = value
            }
            params = converted
        } else {
            return nil
        }
        return AppNotification(
            id: id,
            kind: kind,
            title: title,
            body: body,
            createdAt: createdAt,
            readAt: row["readAt"] as? String,
            route: row["route"] as? String,
            routeParams: params,
            deliverAt: row["deliverAt"] as? String,
            deliveredAt: row["deliveredAt"] as? String
        )
    }
}

enum NotificationsCoding {
    static func decode(_ raw: String?) -> [AppNotification] {
        guard let raw, let data = raw.data(using: .utf8),
              let parsed = try? JSONSerialization.jsonObject(with: data) as? [Any]
        else { return [] }
        return parsed.compactMap(AppNotification.parse)
    }

    static func encode(_ items: [AppNotification]) -> String {
        let objects = items.map { $0.jsonObject() }
        guard let data = try? JSONSerialization.data(withJSONObject: objects),
              let text = String(data: data, encoding: .utf8)
        else { return "[]" }
        return text
    }

    /// Unread first, then newest `createdAt`.
    static func sorted(_ items: [AppNotification]) -> [AppNotification] {
        items.sorted { a, b in
            let aUnread = a.readAt == nil
            let bUnread = b.readAt == nil
            if aUnread != bUnread { return aUnread && !bUnread }
            return a.createdAt > b.createdAt
        }
    }

    /// Items whose `deliverAt` has passed. Disabled yields nothing to present.
    static func due(_ items: [AppNotification], enabled: Bool, now: String) -> (inbox: [AppNotification], present: [AppNotification]) {
        guard enabled else { return (items, []) }
        var present: [AppNotification] = []
        let inbox = items.map { item -> AppNotification in
            guard let deliverAt = item.deliverAt, item.deliveredAt == nil, deliverAt <= now else { return item }
            var delivered = item
            delivered.deliveredAt = now
            present.append(delivered)
            return delivered
        }
        return (inbox, present)
    }
}

protocol NotificationPresenter: AnyObject {
    func present(_ notification: AppNotification)
}

/// The inbox and the device preference. Local stores both on device. Remote stores the inbox on a server.
protocol NotificationsRepository: AnyObject {
    var enabled: Bool { get }
    func setEnabled(_ enabled: Bool)
    func list() -> [AppNotification]
    func upsert(_ notification: AppNotification)
    func markRead(id: String, readAt: String)
    func markAllRead(readAt: String)
    func dismiss(id: String)
    func deliverDue(now: String, presenter: any NotificationPresenter)
}

/// Inbox reads and writes for a remote implementation. The preference stays on the device.
protocol NotificationGateway: AnyObject {
    func list() -> [AppNotification]
    func save(_ notification: AppNotification)
    func remove(id: String)
}

/// Posts and cancels the system notification for one inbox row. The local repository calls this.
protocol NotificationScheduler: AnyObject {
    func schedule(_ notification: AppNotification)
    func cancel(id: String)
    func cancelAll()
}

/// Keeps the inbox and the preference in UserDefaults.
final class UserDefaultsNotificationsRepository: NotificationsRepository {
    private(set) var enabled: Bool
    private let defaults: UserDefaults
    /// Set by the live container. Tests leave it nil, so they never touch the system.
    var scheduler: (any NotificationScheduler)?

    init(defaults: UserDefaults) {
        self.defaults = defaults
        enabled = defaults.string(forKey: AppNotification.enabledKey) == "on"
    }

    func setEnabled(_ enabled: Bool) {
        self.enabled = enabled
        defaults.set(enabled ? "on" : "off", forKey: AppNotification.enabledKey)
        if enabled {
            list().forEach { scheduler?.schedule($0) }
        } else {
            scheduler?.cancelAll()
        }
    }

    func list() -> [AppNotification] {
        NotificationsCoding.sorted(stored())
    }

    func upsert(_ notification: AppNotification) {
        var items = stored().filter { $0.id != notification.id }
        items.append(notification)
        write(items)
        if enabled { scheduler?.schedule(notification) }
    }

    func markRead(id: String, readAt: String) {
        write(stored().map { item in
            guard item.id == id, item.readAt == nil else { return item }
            var copy = item
            copy.readAt = readAt
            return copy
        })
    }

    func markAllRead(readAt: String) {
        write(stored().map { item in
            guard item.readAt == nil else { return item }
            var copy = item
            copy.readAt = readAt
            return copy
        })
    }

    func dismiss(id: String) {
        write(stored().filter { $0.id != id })
        scheduler?.cancel(id: id)
    }

    func deliverDue(now: String, presenter: any NotificationPresenter) {
        let result = NotificationsCoding.due(stored(), enabled: enabled, now: now)
        write(result.inbox)
        result.present.forEach { presenter.present($0) }
    }

    private func stored() -> [AppNotification] {
        NotificationsCoding.decode(defaults.string(forKey: AppNotification.inboxKey))
    }

    private func write(_ items: [AppNotification]) {
        defaults.set(NotificationsCoding.encode(items), forKey: AppNotification.inboxKey)
    }
}

/// The inbox lives on the server. `preferences` holds `notifications.enabled` for this device.
final class RemoteNotificationsRepository: NotificationsRepository {
    private let gateway: any NotificationGateway
    private let preferences: any NotificationsRepository

    init(gateway: any NotificationGateway, preferences: any NotificationsRepository) {
        self.gateway = gateway
        self.preferences = preferences
    }

    var enabled: Bool { preferences.enabled }

    func setEnabled(_ enabled: Bool) {
        preferences.setEnabled(enabled)
    }

    func list() -> [AppNotification] {
        NotificationsCoding.sorted(gateway.list())
    }

    func upsert(_ notification: AppNotification) {
        gateway.save(notification)
    }

    func markRead(id: String, readAt: String) {
        guard var current = gateway.list().first(where: { $0.id == id }), current.readAt == nil else { return }
        current.readAt = readAt
        gateway.save(current)
    }

    func markAllRead(readAt: String) {
        for item in gateway.list() where item.readAt == nil {
            var copy = item
            copy.readAt = readAt
            gateway.save(copy)
        }
    }

    func dismiss(id: String) {
        gateway.remove(id: id)
    }

    func deliverDue(now: String, presenter: any NotificationPresenter) {
        let result = NotificationsCoding.due(gateway.list(), enabled: enabled, now: now)
        result.present.forEach { gateway.save($0) }
        result.present.forEach { presenter.present($0) }
    }
}

/// Keeps the inbox in memory, for previews and tests.
final class InMemoryNotificationsRepository: NotificationsRepository {
    private(set) var enabled: Bool
    private var items: [AppNotification]

    init(items: [AppNotification] = [], enabled: Bool = false) {
        self.items = items
        self.enabled = enabled
    }

    func setEnabled(_ enabled: Bool) {
        self.enabled = enabled
    }

    func list() -> [AppNotification] {
        NotificationsCoding.sorted(items)
    }

    func upsert(_ notification: AppNotification) {
        items.removeAll { $0.id == notification.id }
        items.append(notification)
    }

    func markRead(id: String, readAt: String) {
        guard let index = items.firstIndex(where: { $0.id == id }), items[index].readAt == nil else { return }
        items[index].readAt = readAt
    }

    func markAllRead(readAt: String) {
        for index in items.indices where items[index].readAt == nil {
            items[index].readAt = readAt
        }
    }

    func dismiss(id: String) {
        items.removeAll { $0.id == id }
    }

    func deliverDue(now: String, presenter: any NotificationPresenter) {
        let result = NotificationsCoding.due(items, enabled: enabled, now: now)
        items = result.inbox
        result.present.forEach { presenter.present($0) }
    }
}
