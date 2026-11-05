package app.features.reservation

import androidx.annotation.StringRes
import app.R
import app.features.catalog.Dietary
import app.features.catalog.Occasion
import app.features.catalog.Seating
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

enum class ReservationStatus(val id: String) {
    Confirmed("confirmed"),
    Cancelled("cancelled");

    companion object {
        fun fromId(id: String?): ReservationStatus? = entries.firstOrNull { it.id == id }
    }
}

/** A booking the member made (spec/features/reservation.md). */
data class Reservation(
    val id: String,
    val confirmationCode: String,
    val restaurantId: String,
    val date: LocalDate,
    /** "HH:mm". */
    val time: String,
    val partySize: Int,
    val seating: Seating,
    val occasion: Occasion,
    val dietary: List<Dietary>,
    val notes: String,
    val status: ReservationStatus,
    val createdAt: String,
    val updatedAt: String,
) {
    val dateTime: LocalDateTime get() = date.atTime(LocalTime.parse(time))

    /** Confirmed and its local date-time is after [now]. */
    fun isUpcoming(now: LocalDateTime): Boolean = status == ReservationStatus.Confirmed && dateTime.isAfter(now)

    fun isPast(now: LocalDateTime): Boolean = status == ReservationStatus.Confirmed && !dateTime.isAfter(now)

    val isCancelled: Boolean get() = status == ReservationStatus.Cancelled
}

/** What the member chose in Reserve, before it is saved. */
data class ReservationDraft(
    val restaurantId: String,
    val date: LocalDate,
    val time: String?,
    val partySize: Int,
    val seating: Seating,
    val occasion: Occasion = Occasion.None,
    val dietary: Set<Dietary> = emptySet(),
    val notes: String = "",
)

enum class ReservationError(@StringRes val message: Int) {
    SelectTime(R.string.reserve_error_select_time),
    NotesTooLong(R.string.reserve_error_notes_too_long),
    SlotTaken(R.string.reserve_error_slot_taken),
    DuplicateTime(R.string.reserve_error_duplicate_time),
    DuplicateRestaurant(R.string.reserve_error_duplicate_restaurant),
    Generic(R.string.reserve_error_generic),
}

class ReservationException(val error: ReservationError) : Exception(error.name)
