package app.features.settings

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map

/** Stores the user's preferences. Screens use whichever implementation AppContainer provides. */
interface SettingsRepository {
    val appearance: Flow<Appearance>

    suspend fun setAppearance(appearance: Appearance)
}

/** Keeps settings in Jetpack DataStore. */
class DataStoreSettingsRepository(private val dataStore: DataStore<Preferences>) : SettingsRepository {
    override val appearance: Flow<Appearance> = dataStore.data.map { Appearance.fromId(it[appearanceKey]) }

    override suspend fun setAppearance(appearance: Appearance) {
        dataStore.edit { it[appearanceKey] = appearance.id }
    }

    private companion object {
        val appearanceKey = stringPreferencesKey(Appearance.STORAGE_KEY)
    }
}

/** Keeps settings in memory, for previews and tests. */
class InMemorySettingsRepository(initial: Appearance = Appearance.System) : SettingsRepository {
    private val state = MutableStateFlow(initial)

    override val appearance: Flow<Appearance> = state

    override suspend fun setAppearance(appearance: Appearance) {
        state.value = appearance
    }
}
