package app.core.storage

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.serialization.json.Json

/**
 * String keys holding JSON, the storage shape shared with iOS (UserDefaults) and web (localStorage).
 * Repositories write through this, so DataStore and in-memory implementations store identical data.
 */
interface KeyValueStore {
    fun observe(key: String): Flow<String?>

    suspend fun read(key: String): String? = observe(key).first()

    /** Writes [value], or removes the key when it is null. */
    suspend fun write(key: String, value: String?)
}

class DataStoreKeyValueStore(private val dataStore: DataStore<Preferences>) : KeyValueStore {
    override fun observe(key: String): Flow<String?> =
        dataStore.data.map { it[stringPreferencesKey(key)] }.distinctUntilChanged()

    override suspend fun write(key: String, value: String?) {
        dataStore.edit {
            val preferenceKey = stringPreferencesKey(key)
            if (value == null) it.remove(preferenceKey) else it[preferenceKey] = value
        }
    }
}

class InMemoryKeyValueStore(initial: Map<String, String> = emptyMap()) : KeyValueStore {
    private val values = MutableStateFlow(initial)

    val snapshot: Map<String, String> get() = values.value

    override fun observe(key: String): Flow<String?> = values.map { it[key] }.distinctUntilChanged()

    override suspend fun write(key: String, value: String?) {
        values.update { if (value == null) it - key else it + (key to value) }
    }
}

/** The JSON settings every stored value is read and written with. */
val StorageJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
    explicitNulls = false
}
