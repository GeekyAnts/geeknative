package app.features.profile

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import app.core.storage.DataStoreKeyValueStore
import app.core.storage.InMemoryKeyValueStore
import app.core.storage.KeyValueStore
import app.core.storage.StorageJson
import app.features.auth.AuthRepository
import app.features.catalog.CuisineId
import app.features.catalog.Dietary
import app.features.catalog.Seating
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable

/** The member's dining preferences, which personalise Discover and pre-fill reservations. */
data class DiningPreferences(
    val cuisines: List<CuisineId> = emptyList(),
    val dietary: List<Dietary> = emptyList(),
    val seating: Seating = Seating.Indoor,
    val partySize: Int = DEFAULT_PARTY_SIZE,
    val reminders: Boolean = true,
) {
    companion object {
        const val DEFAULT_PARTY_SIZE = 2
        const val MIN_PARTY_SIZE = 1
        const val MAX_PARTY_SIZE = 12
    }
}

interface PreferencesRepository {
    val preferences: Flow<DiningPreferences>

    suspend fun load(): DiningPreferences

    suspend fun save(preferences: DiningPreferences)
}

@Serializable
private data class StoredPreferences(
    val cuisines: List<String> = emptyList(),
    val dietary: List<String> = emptyList(),
    val seating: String = Seating.Indoor.id,
    val partySize: Int = DiningPreferences.DEFAULT_PARTY_SIZE,
    val reminders: Boolean = true,
)

/** JSON under `preferences.<email>`. Unknown values are dropped; a missing or invalid object means the defaults. */
@OptIn(ExperimentalCoroutinesApi::class)
open class KeyValuePreferencesRepository(private val store: KeyValueStore, private val auth: AuthRepository) : PreferencesRepository {
    override val preferences: Flow<DiningPreferences> = auth.account
        .map { it?.email }
        .distinctUntilChanged()
        .flatMapLatest { email -> if (email == null) flowOf(DiningPreferences()) else store.observe(key(email)).map(::decode) }

    override suspend fun load(): DiningPreferences = preferences.first()

    override suspend fun save(preferences: DiningPreferences) {
        val email = auth.currentAccount()?.email ?: return
        val stored = StoredPreferences(
            cuisines = preferences.cuisines.distinct().map { it.id },
            dietary = preferences.dietary.distinct().sortedBy { it.ordinal }.map { it.id },
            seating = preferences.seating.id,
            partySize = preferences.partySize,
            reminders = preferences.reminders,
        )
        store.write(key(email), StorageJson.encodeToString(StoredPreferences.serializer(), stored))
    }

    private fun decode(text: String?): DiningPreferences {
        val stored = text?.let { runCatching { StorageJson.decodeFromString(StoredPreferences.serializer(), it) }.getOrNull() }
            ?: return DiningPreferences()
        return DiningPreferences(
            cuisines = stored.cuisines.mapNotNull(CuisineId::fromId).distinct(),
            dietary = stored.dietary.mapNotNull(Dietary::fromId).distinct().sortedBy { it.ordinal },
            seating = Seating.fromId(stored.seating) ?: Seating.Indoor,
            partySize = stored.partySize.coerceIn(DiningPreferences.MIN_PARTY_SIZE, DiningPreferences.MAX_PARTY_SIZE),
            reminders = stored.reminders,
        )
    }

    companion object {
        fun key(email: String) = "preferences.$email"
    }
}

class DataStorePreferencesRepository(dataStore: DataStore<Preferences>, auth: AuthRepository) :
    KeyValuePreferencesRepository(DataStoreKeyValueStore(dataStore), auth)

class InMemoryPreferencesRepository(auth: AuthRepository, val store: InMemoryKeyValueStore = InMemoryKeyValueStore()) :
    KeyValuePreferencesRepository(store, auth)
