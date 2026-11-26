package app.features.tripplanner

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.CatalogJson
import app.features.catalog.CatalogRepository
import app.features.catalog.Place
import java.time.LocalDate
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer

interface TripRepository {
    val trips: Flow<List<Trip>>

    suspend fun upsert(trip: Trip)

    suspend fun delete(id: String)

    fun generate(request: GenerateRequest): GenerateResult

    fun budgetFor(trip: Trip): BudgetBreakdown?
}

class DataStoreTripRepository(
    private val dataStore: DataStore<Preferences>,
    private val catalog: CatalogRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : TripRepository {
    override val trips: Flow<List<Trip>> = dataStore.data.map { prefs ->
        decodeTrips(prefs[tripsKey]).map { rewriteStatusOnRead(it, today()) }
    }

    override suspend fun upsert(trip: Trip) {
        dataStore.edit { prefs ->
            val current = decodeTrips(prefs[tripsKey])
            val next = listOf(trip) + current.filterNot { it.id == trip.id }
            prefs[tripsKey] = encodeTrips(next)
        }
    }

    override suspend fun delete(id: String) {
        dataStore.edit { prefs ->
            val next = decodeTrips(prefs[tripsKey]).filterNot { it.id == id }
            prefs[tripsKey] = encodeTrips(next)
        }
    }

    override fun generate(request: GenerateRequest): GenerateResult {
        val destination = request.destinationId?.let { catalog.destination(it) }
        return generateTrip(request, destination, catalog.places().associateBy { it.id })
    }

    override fun budgetFor(trip: Trip): BudgetBreakdown? {
        val destination = catalog.destination(trip.destinationId) ?: return null
        return estimateBudget(destination, trip.budgetBand, trip.days.size.coerceAtLeast(1), trip.travelers)
    }

    private companion object {
        val tripsKey = stringPreferencesKey(STORAGE_KEY)
        const val STORAGE_KEY = "trips.list"
    }
}

class InMemoryTripRepository(
    initial: List<Trip> = emptyList(),
    private val catalog: CatalogRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : TripRepository {
    private val state = MutableStateFlow(initial.map { rewriteStatusOnRead(it, today()) })

    override val trips: Flow<List<Trip>> = state.map { list ->
        list.map { rewriteStatusOnRead(it, today()) }
    }

    override suspend fun upsert(trip: Trip) {
        state.value = listOf(trip) + state.value.filterNot { it.id == trip.id }
    }

    override suspend fun delete(id: String) {
        state.value = state.value.filterNot { it.id == id }
    }

    override fun generate(request: GenerateRequest): GenerateResult {
        val destination = request.destinationId?.let { catalog.destination(it) }
        return generateTrip(request, destination, catalog.places().associateBy { it.id })
    }

    override fun budgetFor(trip: Trip): BudgetBreakdown? {
        val destination = catalog.destination(trip.destinationId) ?: return null
        return estimateBudget(destination, trip.budgetBand, trip.days.size.coerceAtLeast(1), trip.travelers)
    }
}

fun matchingTripsForPlace(trips: List<Trip>, place: Place, today: LocalDate): List<Trip> =
    trips.filter { trip ->
        trip.destinationId == place.destinationId &&
            classifyTrip(rewriteStatusOnRead(trip, today), today) != TripSegment.Past
    }

internal fun decodeTrips(raw: String?): List<Trip> {
    if (raw.isNullOrBlank()) return emptyList()
    return try {
        CatalogJson.decodeFromString(ListSerializer(Trip.serializer()), raw)
    } catch (_: Exception) {
        emptyList()
    }
}

internal fun encodeTrips(trips: List<Trip>): String =
    CatalogJson.encodeToString(ListSerializer(Trip.serializer()), trips)
