package app.features.wedding

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.Enquiry
import app.features.catalog.WeddingPlan
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json

private val catalogJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

fun parsePlan(raw: String?): WeddingPlan {
    if (raw.isNullOrBlank()) return WeddingPlan.Empty
    return try {
        val parsed = catalogJson.decodeFromString<WeddingPlan>(raw)
        if (parsed.guestCount <= 0) parsed.copy(guestCount = WeddingPlan.Empty.guestCount) else parsed
    } catch (_: Exception) {
        WeddingPlan.Empty
    }
}

fun parseEnquiries(raw: String?): List<Enquiry> {
    if (raw.isNullOrBlank()) return emptyList()
    return try {
        catalogJson.decodeFromString<List<Enquiry>>(raw)
    } catch (_: Exception) {
        emptyList()
    }
}

interface WeddingRepository {
    val plan: Flow<WeddingPlan>
    val enquiries: Flow<List<Enquiry>>

    suspend fun savePlan(plan: WeddingPlan)
    suspend fun addEnquiry(enquiry: Enquiry)
}

suspend fun WeddingRepository.currentPlan(): WeddingPlan = plan.first()

suspend fun WeddingRepository.updatePlan(transform: (WeddingPlan) -> WeddingPlan) {
    savePlan(transform(currentPlan()))
}

class DataStoreWeddingRepository(private val dataStore: DataStore<Preferences>) : WeddingRepository {
    override val plan: Flow<WeddingPlan> = dataStore.data.map { parsePlan(it[planKey]) }

    override val enquiries: Flow<List<Enquiry>> = dataStore.data.map { parseEnquiries(it[enquiriesKey]) }

    override suspend fun savePlan(plan: WeddingPlan) {
        dataStore.edit { it[planKey] = catalogJson.encodeToString(WeddingPlan.serializer(), plan) }
    }

    override suspend fun addEnquiry(enquiry: Enquiry) {
        dataStore.edit { preferences ->
            val next = parseEnquiries(preferences[enquiriesKey]) + enquiry
            preferences[enquiriesKey] = catalogJson.encodeToString(next)
        }
    }

    private companion object {
        val planKey = stringPreferencesKey(WeddingPlan.PLAN_STORAGE_KEY)
        val enquiriesKey = stringPreferencesKey(WeddingPlan.ENQUIRIES_STORAGE_KEY)
    }
}

class InMemoryWeddingRepository(
    initialPlan: WeddingPlan = WeddingPlan.Empty,
    initialEnquiries: List<Enquiry> = emptyList(),
) : WeddingRepository {
    private val planState = MutableStateFlow(initialPlan)
    private val enquiryState = MutableStateFlow(initialEnquiries)

    override val plan: Flow<WeddingPlan> = planState.asStateFlow()
    override val enquiries: Flow<List<Enquiry>> = enquiryState.asStateFlow()

    override suspend fun savePlan(plan: WeddingPlan) {
        planState.value = plan
    }

    override suspend fun addEnquiry(enquiry: Enquiry) {
        enquiryState.value = enquiryState.value + enquiry
    }
}
