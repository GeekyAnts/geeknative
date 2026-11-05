package app.features.reservation

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import app.core.Timestamps
import app.core.storage.DataStoreKeyValueStore
import app.core.storage.InMemoryKeyValueStore
import app.core.storage.KeyValueStore
import app.core.storage.StorageJson
import app.features.auth.AuthRepository
import app.features.catalog.CatalogRepository
import app.features.catalog.Dietary
import app.features.catalog.Occasion
import app.features.catalog.Seating
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID
import kotlin.random.Random
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer

/** The signed-in member's reservations. Writes are serialized so duplicate checks can't race. */
interface ReservationsRepository {
    /** Every screen observes this, so lists update as soon as anything changes. */
    val reservations: Flow<List<Reservation>>

    suspend fun list(): List<Reservation>

    suspend fun get(id: String): Reservation?

    /** Validates and saves a new confirmed reservation. Throws [ReservationException]. */
    suspend fun create(draft: ReservationDraft): Reservation

    /** Applies [draft] to an upcoming reservation, keeping its id and code. Throws [ReservationException]. */
    suspend fun update(id: String, draft: ReservationDraft): Reservation

    suspend fun cancel(id: String): Reservation
}

@Serializable
internal data class StoredReservation(
    val id: String,
    val confirmationCode: String,
    val restaurantId: String,
    val date: String,
    val time: String,
    val partySize: Int,
    val seating: String,
    val occasion: String,
    val dietary: List<String> = emptyList(),
    val notes: String = "",
    val status: String,
    val createdAt: String,
    val updatedAt: String,
)

/** A JSON array under `reservations.<email>`, newest `createdAt` first. */
@OptIn(ExperimentalCoroutinesApi::class)
open class KeyValueReservationsRepository(
    private val store: KeyValueStore,
    private val auth: AuthRepository,
    private val catalog: CatalogRepository,
    private val clock: Clock,
    private val random: Random = Random.Default,
) : ReservationsRepository {
    private val mutex = Mutex()
    private val serializer = ListSerializer(StoredReservation.serializer())

    override val reservations: Flow<List<Reservation>> = auth.account
        .map { it?.email }
        .distinctUntilChanged()
        .flatMapLatest { email -> if (email == null) flowOf(emptyList()) else store.observe(key(email)).map(::decode) }

    override suspend fun list(): List<Reservation> = reservations.first()

    override suspend fun get(id: String): Reservation? = list().firstOrNull { it.id == id }

    override suspend fun create(draft: ReservationDraft): Reservation = write { email, existing ->
        val now = LocalDateTime.now(clock)
        val restaurant = runCatching { catalog.load().restaurant(draft.restaurantId) }.getOrNull()
        ReservationValidator.validate(draft, restaurant, existing, now)?.let { throw ReservationException(it) }
        val timestamp = Timestamps.now(clock)
        val reservation = Reservation(
            id = UUID.randomUUID().toString().lowercase(),
            confirmationCode = newCode(existing.map { it.confirmationCode }.toSet()),
            restaurantId = draft.restaurantId,
            date = draft.date,
            time = draft.time!!,
            partySize = draft.partySize,
            seating = draft.seating,
            occasion = draft.occasion,
            dietary = draft.dietary.sortedBy { it.ordinal },
            notes = draft.notes,
            status = ReservationStatus.Confirmed,
            createdAt = timestamp,
            updatedAt = timestamp,
        )
        reservation to (listOf(reservation) + existing)
    }

    override suspend fun update(id: String, draft: ReservationDraft): Reservation = write { _, existing ->
        val now = LocalDateTime.now(clock)
        val original = existing.firstOrNull { it.id == id && it.isUpcoming(now) } ?: throw ReservationException(ReservationError.Generic)
        val restaurant = runCatching { catalog.load().restaurant(draft.restaurantId) }.getOrNull()
        ReservationValidator.validate(draft, restaurant, existing, now, editing = original)?.let { throw ReservationException(it) }
        val updated = original.copy(
            restaurantId = draft.restaurantId,
            date = draft.date,
            time = draft.time!!,
            partySize = draft.partySize,
            seating = draft.seating,
            occasion = draft.occasion,
            dietary = draft.dietary.sortedBy { it.ordinal },
            notes = draft.notes,
            updatedAt = Timestamps.now(clock),
        )
        updated to existing.map { if (it.id == id) updated else it }
    }

    override suspend fun cancel(id: String): Reservation = write { _, existing ->
        val now = LocalDateTime.now(clock)
        val original = existing.firstOrNull { it.id == id && it.isUpcoming(now) } ?: throw ReservationException(ReservationError.Generic)
        val cancelled = original.copy(status = ReservationStatus.Cancelled, updatedAt = Timestamps.now(clock))
        cancelled to existing.map { if (it.id == id) cancelled else it }
    }

    /** Runs one write at a time: reads the member's list, applies [change], stores the result. */
    private suspend fun write(change: suspend (email: String, existing: List<Reservation>) -> Pair<Reservation, List<Reservation>>): Reservation =
        mutex.withLock {
            val email = auth.currentAccount()?.email ?: throw ReservationException(ReservationError.Generic)
            val existing = decode(store.read(key(email)))
            val (result, next) = change(email, existing)
            store.write(key(email), encode(next.sortedByDescending { it.createdAt }))
            result
        }

    private fun newCode(taken: Set<String>): String {
        while (true) {
            val code = CODE_PREFIX + (1..CODE_LENGTH).map { CODE_ALPHABET[random.nextInt(CODE_ALPHABET.length)] }.joinToString("")
            if (code !in taken) return code
        }
    }

    private fun encode(reservations: List<Reservation>): String = StorageJson.encodeToString(
        serializer,
        reservations.map {
            StoredReservation(
                id = it.id,
                confirmationCode = it.confirmationCode,
                restaurantId = it.restaurantId,
                date = it.date.toString(),
                time = it.time,
                partySize = it.partySize,
                seating = it.seating.id,
                occasion = it.occasion.id,
                dietary = it.dietary.map { d -> d.id },
                notes = it.notes,
                status = it.status.id,
                createdAt = it.createdAt,
                updatedAt = it.updatedAt,
            )
        },
    )

    private fun decode(text: String?): List<Reservation> {
        val stored = text?.let { runCatching { StorageJson.decodeFromString(serializer, it) }.getOrNull() } ?: return emptyList()
        return stored.mapNotNull { s ->
            runCatching {
                Reservation(
                    id = s.id,
                    confirmationCode = s.confirmationCode,
                    restaurantId = s.restaurantId,
                    date = LocalDate.parse(s.date),
                    time = s.time,
                    partySize = s.partySize,
                    seating = Seating.fromId(s.seating) ?: return@mapNotNull null,
                    occasion = Occasion.fromId(s.occasion) ?: Occasion.None,
                    dietary = s.dietary.mapNotNull(Dietary::fromId).sortedBy { it.ordinal },
                    notes = s.notes,
                    status = ReservationStatus.fromId(s.status) ?: return@mapNotNull null,
                    createdAt = s.createdAt,
                    updatedAt = s.updatedAt,
                ).also { it.dateTime }
            }.getOrNull()
        }
    }

    companion object {
        const val CODE_PREFIX = "DC-"
        const val CODE_LENGTH = 6
        const val CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

        fun key(email: String) = "reservations.$email"
    }
}

class DataStoreReservationsRepository(
    dataStore: DataStore<Preferences>,
    auth: AuthRepository,
    catalog: CatalogRepository,
    clock: Clock,
) : KeyValueReservationsRepository(DataStoreKeyValueStore(dataStore), auth, catalog, clock)

class InMemoryReservationsRepository(
    auth: AuthRepository,
    catalog: CatalogRepository,
    clock: Clock,
    val store: InMemoryKeyValueStore = InMemoryKeyValueStore(),
    random: Random = Random.Default,
) : KeyValueReservationsRepository(store, auth, catalog, clock, random)
