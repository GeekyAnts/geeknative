package app.features.notifications

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

@OptIn(ExperimentalCoroutinesApi::class)
class NotificationsTest {
    @get:Rule
    val folder = TemporaryFolder()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun repository(file: File, scope: CoroutineScope) = DataStoreNotificationsRepository(
        PreferenceDataStoreFactory.create(scope = scope, produceFile = { file }),
    )

    private fun note(
        id: String,
        createdAt: String,
        readAt: String? = null,
        deliverAt: String? = null,
    ) = AppNotification(id = id, kind = "reminder", title = id, body = "body", createdAt = createdAt, readAt = readAt, deliverAt = deliverAt)

    @Test
    fun deliveryDefaultsToOffAndTheInboxIsEmpty() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val repository = repository(File(folder.root, "empty.preferences_pb"), scope)
        assertFalse(repository.enabled.first())
        assertTrue(repository.list().isEmpty())
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun listsUnreadFirstThenNewest() = runTest {
        val repository = InMemoryNotificationsRepository()
        repository.upsert(note("old-unread", "2026-01-01T00:00:00Z"))
        repository.upsert(note("new-read", "2026-03-01T00:00:00Z", readAt = "2026-03-02T00:00:00Z"))
        repository.upsert(note("new-unread", "2026-02-01T00:00:00Z"))
        assertEquals(listOf("new-unread", "old-unread", "new-read"), repository.list().map { it.id })
    }

    @Test
    fun markReadKeepsTheFirstTimestampAndDismissRemovesTheRow() = runTest {
        val repository = InMemoryNotificationsRepository(
            listOf(note("a", "2026-01-01T00:00:00Z"), note("b", "2026-01-02T00:00:00Z")),
        )
        repository.markRead("a", "2026-01-03T00:00:00Z")
        repository.markRead("a", "2026-01-04T00:00:00Z")
        assertEquals("2026-01-03T00:00:00Z", repository.list().first { it.id == "a" }.readAt)
        repository.markAllRead("2026-01-05T00:00:00Z")
        assertTrue(repository.list().all { it.readAt != null })
        repository.dismiss("b")
        assertEquals(listOf("a"), repository.list().map { it.id })
    }

    @Test
    fun theLocalInboxSurvivesANewRepositoryOnTheSameStore() = runTest {
        val file = File(folder.root, "kept.preferences_pb")
        val first = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val stored = repository(file, first)
        stored.upsert(note("kept", "2026-01-01T00:00:00Z").copy(route = "home", routeParams = mapOf("tab" to "saved")))
        stored.setEnabled(true)
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val again = repository(file, second)
        assertTrue(again.enabled.first())
        assertEquals(mapOf("tab" to "saved"), again.list().single().routeParams)
        assertTrue(NotificationsCoding.decode("not json").isEmpty())
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun presentsADueNotificationOnceAndStaysQuietWhenDeliveryIsOff() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val repository = repository(File(folder.root, "due.preferences_pb"), scope)
        repository.upsert(note("due", "2026-01-01T00:00:00Z", deliverAt = "2026-01-02T00:00:00Z"))
        val early = mutableListOf<String>()
        repository.deliverDue("2026-01-01T00:00:00Z") { early += it.id }
        assertTrue(early.isEmpty())

        repository.setEnabled(true)
        val presented = mutableListOf<String>()
        repository.deliverDue("2026-01-02T00:00:00Z") { presented += it.id }
        repository.deliverDue("2026-01-03T00:00:00Z") { presented += it.id }
        assertEquals(listOf("due"), presented)
        assertEquals("2026-01-02T00:00:00Z", repository.list().single().deliveredAt)
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun aRemoteInboxUsesTheGatewayAndKeepsThePreferenceOnTheDevice() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val preferences = repository(File(folder.root, "remote.preferences_pb"), scope)
        val gateway = MemoryGateway(mutableListOf(note("server", "2026-01-01T00:00:00Z", deliverAt = "2026-01-02T00:00:00Z")))
        val repository = RemoteNotificationsRepository(gateway, preferences)
        assertFalse(repository.enabled.first())
        repository.setEnabled(true)
        assertTrue(preferences.enabled.first())
        val presented = mutableListOf<String>()
        repository.deliverDue("2026-01-02T00:00:00Z") { presented += it.id }
        assertEquals(listOf("server"), presented)
        assertEquals("2026-01-02T00:00:00Z", gateway.items.single().deliveredAt)
        repository.dismiss("server")
        assertTrue(repository.list().isEmpty())
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    private class MemoryGateway(val items: MutableList<AppNotification>) : NotificationGateway {
        override suspend fun list(): List<AppNotification> = items.toList()

        override suspend fun save(notification: AppNotification) {
            items.removeAll { it.id == notification.id }
            items += notification
        }

        override suspend fun remove(id: String) {
            items.removeAll { it.id == id }
        }
    }
}
