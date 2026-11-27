package app.features.notifications

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** One inbox row. The JSON keys match iOS and web. */
@Serializable
data class AppNotification(
    val id: String,
    val kind: String,
    val title: String,
    val body: String,
    val createdAt: String,
    val readAt: String? = null,
    val route: String? = null,
    val routeParams: Map<String, String> = emptyMap(),
    val deliverAt: String? = null,
    val deliveredAt: String? = null,
)

private val inboxJson = Json { explicitNulls = true; ignoreUnknownKeys = true }

object NotificationsCoding {
    const val ENABLED_KEY = "notifications.enabled"
    const val INBOX_KEY = "notifications.inbox"

    fun decode(raw: String?): List<AppNotification> {
        if (raw.isNullOrEmpty()) return emptyList()
        return runCatching { inboxJson.decodeFromString<List<AppNotification>>(raw) }.getOrDefault(emptyList())
    }

    fun encode(items: List<AppNotification>): String = inboxJson.encodeToString(items)

    /** Unread first, then newest `createdAt`. */
    fun sorted(items: List<AppNotification>): List<AppNotification> =
        items.sortedWith(compareByDescending<AppNotification> { it.readAt == null }.thenByDescending { it.createdAt })

    /** Items whose `deliverAt` has passed. Disabled yields nothing to present. */
    fun due(items: List<AppNotification>, enabled: Boolean, now: String): Pair<List<AppNotification>, List<AppNotification>> {
        if (!enabled) return items to emptyList()
        val present = mutableListOf<AppNotification>()
        val inbox = items.map { item ->
            val deliverAt = item.deliverAt
            if (deliverAt == null || item.deliveredAt != null || deliverAt > now) item
            else item.copy(deliveredAt = now).also { present += it }
        }
        return inbox to present
    }
}

fun interface NotificationPresenter {
    fun present(notification: AppNotification)
}

/** The inbox and the device preference. Local stores both on device. Remote stores the inbox on a server. */
interface NotificationsRepository {
    val enabled: Flow<Boolean>

    suspend fun setEnabled(enabled: Boolean)

    suspend fun list(): List<AppNotification>

    suspend fun upsert(notification: AppNotification)

    suspend fun markRead(id: String, readAt: String)

    suspend fun markAllRead(readAt: String)

    suspend fun dismiss(id: String)

    /** Hands due items to [present] once, and records `deliveredAt` so they are not presented again. */
    suspend fun deliverDue(now: String, present: NotificationPresenter)
}

/** Inbox reads and writes for a remote implementation. The preference stays on the device. */
interface NotificationGateway {
    suspend fun list(): List<AppNotification>

    suspend fun save(notification: AppNotification)

    suspend fun remove(id: String)
}

/** Keeps the inbox and the preference in Jetpack DataStore. */
class DataStoreNotificationsRepository(private val dataStore: DataStore<Preferences>) : NotificationsRepository {
    /** Set by the live container. Tests leave it null. */
    var scheduler: NotificationScheduler? = null
    override val enabled: Flow<Boolean> = dataStore.data.map { it[enabledKey] == "on" }

    override suspend fun setEnabled(enabled: Boolean) {
        dataStore.edit { it[enabledKey] = if (enabled) "on" else "off" }
        if (enabled) stored().forEach { scheduler?.schedule(it) } else stored().forEach { scheduler?.cancel(it.id) }
    }

    override suspend fun list(): List<AppNotification> = NotificationsCoding.sorted(stored())

    override suspend fun upsert(notification: AppNotification) {
        write(stored().filter { it.id != notification.id } + notification)
        if (enabled.first()) scheduler?.schedule(notification)
    }

    override suspend fun markRead(id: String, readAt: String) {
        write(stored().map { if (it.id == id && it.readAt == null) it.copy(readAt = readAt) else it })
    }

    override suspend fun markAllRead(readAt: String) {
        write(stored().map { if (it.readAt == null) it.copy(readAt = readAt) else it })
    }

    override suspend fun dismiss(id: String) {
        write(stored().filter { it.id != id })
        scheduler?.cancel(id)
    }

    override suspend fun deliverDue(now: String, present: NotificationPresenter) {
        val (inbox, due) = NotificationsCoding.due(stored(), enabled.first(), now)
        write(inbox)
        due.forEach { present.present(it) }
    }

    private suspend fun stored(): List<AppNotification> = NotificationsCoding.decode(dataStore.data.first()[inboxKey])

    private suspend fun write(items: List<AppNotification>) {
        dataStore.edit { it[inboxKey] = NotificationsCoding.encode(items) }
    }

    private companion object {
        val enabledKey = stringPreferencesKey(NotificationsCoding.ENABLED_KEY)
        val inboxKey = stringPreferencesKey(NotificationsCoding.INBOX_KEY)
    }
}

/**
 * The inbox lives on the server through [gateway]. [preferences] holds `notifications.enabled`
 * for this device.
 */
class RemoteNotificationsRepository(
    private val gateway: NotificationGateway,
    private val preferences: NotificationsRepository,
) : NotificationsRepository {
    override val enabled: Flow<Boolean> = preferences.enabled

    override suspend fun setEnabled(enabled: Boolean) = preferences.setEnabled(enabled)

    override suspend fun list(): List<AppNotification> = NotificationsCoding.sorted(gateway.list())

    override suspend fun upsert(notification: AppNotification) = gateway.save(notification)

    override suspend fun markRead(id: String, readAt: String) {
        val current = gateway.list().find { it.id == id } ?: return
        if (current.readAt != null) return
        gateway.save(current.copy(readAt = readAt))
    }

    override suspend fun markAllRead(readAt: String) {
        gateway.list().filter { it.readAt == null }.forEach { gateway.save(it.copy(readAt = readAt)) }
    }

    override suspend fun dismiss(id: String) = gateway.remove(id)

    override suspend fun deliverDue(now: String, present: NotificationPresenter) {
        val (_, due) = NotificationsCoding.due(gateway.list(), preferences.enabled.first(), now)
        due.forEach { gateway.save(it) }
        due.forEach { present.present(it) }
    }
}

/** Keeps the inbox in memory, for previews and tests. */
class InMemoryNotificationsRepository(
    items: List<AppNotification> = emptyList(),
    enabled: Boolean = false,
) : NotificationsRepository {
    private val enabledState = MutableStateFlow(enabled)
    private val itemsState = MutableStateFlow(items)

    override val enabled: Flow<Boolean> = enabledState

    override suspend fun setEnabled(enabled: Boolean) {
        enabledState.value = enabled
    }

    override suspend fun list(): List<AppNotification> = NotificationsCoding.sorted(itemsState.value)

    override suspend fun upsert(notification: AppNotification) {
        itemsState.value = itemsState.value.filter { it.id != notification.id } + notification
    }

    override suspend fun markRead(id: String, readAt: String) {
        itemsState.value = itemsState.value.map { if (it.id == id && it.readAt == null) it.copy(readAt = readAt) else it }
    }

    override suspend fun markAllRead(readAt: String) {
        itemsState.value = itemsState.value.map { if (it.readAt == null) it.copy(readAt = readAt) else it }
    }

    override suspend fun dismiss(id: String) {
        itemsState.value = itemsState.value.filter { it.id != id }
    }

    override suspend fun deliverDue(now: String, present: NotificationPresenter) {
        val (inbox, due) = NotificationsCoding.due(itemsState.value, enabledState.value, now)
        itemsState.value = inbox
        due.forEach { present.present(it) }
    }
}
