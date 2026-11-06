package app.features.explore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import app.core.storage.DataStoreKeyValueStore
import app.core.storage.InMemoryKeyValueStore
import app.core.storage.KeyValueStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

enum class ExploreViewMode(val id: String) {
    List("list"),
    Grid("grid");

    companion object {
        fun fromId(id: String?): ExploreViewMode = entries.firstOrNull { it.id == id } ?: List
    }
}

/** Explore's grid/list choice, stored under `explore.viewMode` and shared by all members on the device. */
interface ExploreRepository {
    val viewMode: Flow<ExploreViewMode>

    suspend fun setViewMode(mode: ExploreViewMode)
}

open class KeyValueExploreRepository(private val store: KeyValueStore) : ExploreRepository {
    override val viewMode: Flow<ExploreViewMode> = store.observe(VIEW_MODE_KEY).map(ExploreViewMode::fromId)

    override suspend fun setViewMode(mode: ExploreViewMode) {
        store.write(VIEW_MODE_KEY, mode.id)
    }

    companion object {
        const val VIEW_MODE_KEY = "explore.viewMode"
    }
}

class DataStoreExploreRepository(dataStore: DataStore<Preferences>) : KeyValueExploreRepository(DataStoreKeyValueStore(dataStore))

class InMemoryExploreRepository(val store: InMemoryKeyValueStore = InMemoryKeyValueStore()) : KeyValueExploreRepository(store)
