package app.features.saved

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import app.core.storage.DataStoreKeyValueStore
import app.core.storage.InMemoryKeyValueStore
import app.core.storage.KeyValueStore
import app.core.storage.StorageJson
import app.features.auth.AuthRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer

/** The signed-in member's favourite restaurants. */
interface SavedRepository {
    /** Saved restaurant IDs, most recently saved first. Every heart in the app observes this. */
    val savedIds: Flow<List<String>>

    suspend fun ids(): List<String>

    /** Returns the new saved state. */
    suspend fun toggle(restaurantId: String): Boolean

    suspend fun isSaved(restaurantId: String): Boolean
}

/** A JSON array of restaurant IDs under `saved.<email>`, most recently saved first. */
@OptIn(ExperimentalCoroutinesApi::class)
open class KeyValueSavedRepository(private val store: KeyValueStore, private val auth: AuthRepository) : SavedRepository {
    private val mutex = Mutex()
    private val serializer = ListSerializer(String.serializer())

    override val savedIds: Flow<List<String>> = auth.account
        .map { it?.email }
        .distinctUntilChanged()
        .flatMapLatest { email -> if (email == null) flowOf(emptyList()) else store.observe(key(email)).map(::decode) }

    override suspend fun ids(): List<String> = savedIds.first()

    override suspend fun toggle(restaurantId: String): Boolean = mutex.withLock {
        val email = auth.currentAccount()?.email ?: return false
        val current = decode(store.read(key(email)))
        val saved = restaurantId !in current
        val next = if (saved) listOf(restaurantId) + current else current - restaurantId
        store.write(key(email), StorageJson.encodeToString(serializer, next))
        saved
    }

    override suspend fun isSaved(restaurantId: String): Boolean = restaurantId in ids()

    private fun decode(text: String?): List<String> =
        text?.let { runCatching { StorageJson.decodeFromString(serializer, it) }.getOrNull() }?.distinct() ?: emptyList()

    companion object {
        fun key(email: String) = "saved.$email"
    }
}

class DataStoreSavedRepository(dataStore: DataStore<Preferences>, auth: AuthRepository) :
    KeyValueSavedRepository(DataStoreKeyValueStore(dataStore), auth)

class InMemorySavedRepository(auth: AuthRepository, val store: InMemoryKeyValueStore = InMemoryKeyValueStore()) :
    KeyValueSavedRepository(store, auth)
