package app.features.saved

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.CatalogJson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer

@Serializable
data class SavedItem(
    val id: String,
    val kind: String,
)

/** Bookmarked destinations and places. Newest first. Key `saved.items`. */
interface SavedRepository {
    val items: Flow<List<SavedItem>>

    suspend fun toggle(id: String, kind: String)

    suspend fun remove(id: String)
}

class DataStoreSavedRepository(private val dataStore: DataStore<Preferences>) : SavedRepository {
    override val items: Flow<List<SavedItem>> = dataStore.data.map { prefs ->
        decodeSavedItems(prefs[itemsKey])
    }

    override suspend fun toggle(id: String, kind: String) {
        dataStore.edit { prefs ->
            val current = decodeSavedItems(prefs[itemsKey])
            val next = if (current.any { it.id == id }) {
                current.filterNot { it.id == id }
            } else {
                listOf(SavedItem(id, kind)) + current
            }
            prefs[itemsKey] = encodeSavedItems(next)
        }
    }

    override suspend fun remove(id: String) {
        dataStore.edit { prefs ->
            val next = decodeSavedItems(prefs[itemsKey]).filterNot { it.id == id }
            prefs[itemsKey] = encodeSavedItems(next)
        }
    }

    private companion object {
        val itemsKey = stringPreferencesKey(STORAGE_KEY)
        const val STORAGE_KEY = "saved.items"
    }
}

class InMemorySavedRepository(initial: List<SavedItem> = emptyList()) : SavedRepository {
    private val state = MutableStateFlow(collapseDuplicates(initial))

    override val items: Flow<List<SavedItem>> = state

    override suspend fun toggle(id: String, kind: String) {
        val current = state.value
        state.value = if (current.any { it.id == id }) {
            current.filterNot { it.id == id }
        } else {
            listOf(SavedItem(id, kind)) + current
        }
    }

    override suspend fun remove(id: String) {
        state.value = state.value.filterNot { it.id == id }
    }
}

internal fun decodeSavedItems(raw: String?): List<SavedItem> {
    if (raw.isNullOrBlank()) return emptyList()
    return try {
        collapseDuplicates(
            CatalogJson.decodeFromString(ListSerializer(SavedItem.serializer()), raw),
        )
    } catch (_: Exception) {
        emptyList()
    }
}

internal fun encodeSavedItems(items: List<SavedItem>): String =
    CatalogJson.encodeToString(ListSerializer(SavedItem.serializer()), collapseDuplicates(items))

private fun collapseDuplicates(items: List<SavedItem>): List<SavedItem> = items.distinctBy { it.id }
