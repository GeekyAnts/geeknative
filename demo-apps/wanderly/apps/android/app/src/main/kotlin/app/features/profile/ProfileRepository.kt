package app.features.profile

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.CatalogJson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable

@Serializable
data class ProfileData(
    val displayName: String = "",
    val email: String = "",
    val defaultTravelers: Int = 2,
    val budgetBand: String = "mid",
    val preferredCategories: List<String> = emptyList(),
) {
    companion object {
        val DEFAULT = ProfileData()
    }

    fun normalized(): ProfileData = copy(
        defaultTravelers = defaultTravelers.coerceIn(1, 8),
        budgetBand = when (budgetBand) {
            "value", "mid", "luxury" -> budgetBand
            else -> "mid"
        },
    )
}

interface ProfileRepository {
    val data: Flow<ProfileData>

    suspend fun update(data: ProfileData)
}

class DataStoreProfileRepository(private val dataStore: DataStore<Preferences>) : ProfileRepository {
    override val data: Flow<ProfileData> = dataStore.data.map { prefs ->
        decodeProfile(prefs[profileKey])
    }

    override suspend fun update(data: ProfileData) {
        dataStore.edit { it[profileKey] = encodeProfile(data.normalized()) }
    }

    private companion object {
        val profileKey = stringPreferencesKey(STORAGE_KEY)
        const val STORAGE_KEY = "profile.data"
    }
}

class InMemoryProfileRepository(initial: ProfileData = ProfileData.DEFAULT) : ProfileRepository {
    private val state = MutableStateFlow(initial.normalized())

    override val data: Flow<ProfileData> = state

    override suspend fun update(data: ProfileData) {
        state.value = data.normalized()
    }
}

internal fun decodeProfile(raw: String?): ProfileData {
    if (raw.isNullOrBlank()) return ProfileData.DEFAULT
    return try {
        CatalogJson.decodeFromString(ProfileData.serializer(), raw).normalized()
    } catch (_: Exception) {
        ProfileData.DEFAULT
    }
}

internal fun encodeProfile(data: ProfileData): String =
    CatalogJson.encodeToString(ProfileData.serializer(), data.normalized())
