package app.features.reservation

import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import java.time.LocalDateTime

/** The checks run when saving a reservation, in the spec's order (spec/features/reservation.md). */
object ReservationValidator {
    const val MAX_NOTES_LENGTH = 280

    /**
     * Returns the first failing check, or null. [existing] is the member's reservations; [editing]
     * is the reservation being modified, which is excluded from the duplicate checks and whose own
     * slot always counts as available.
     */
    fun validate(
        draft: ReservationDraft,
        restaurant: Restaurant?,
        existing: List<Reservation>,
        now: LocalDateTime,
        editing: Reservation? = null,
    ): ReservationError? {
        val time = draft.time ?: return ReservationError.SelectTime
        if (draft.notes.length > MAX_NOTES_LENGTH) return ReservationError.NotesTooLong
        if (restaurant == null) return ReservationError.Generic
        val ownSlot = editing != null && editing.date == draft.date && editing.time == time
        val available = DemoAvailability.slots(restaurant, draft.date, now).any { it.time == time && it.available }
        if (!ownSlot && !available) return ReservationError.SlotTaken
        val others = existing.filter { it.id != editing?.id && it.isUpcoming(now) }
        if (others.any { it.date == draft.date && it.time == time }) return ReservationError.DuplicateTime
        if (others.any { it.restaurantId == draft.restaurantId && it.date == draft.date }) return ReservationError.DuplicateRestaurant
        return null
    }

    /** Continue from step 1 requires a time. */
    fun detailsError(draft: ReservationDraft): ReservationError? = if (draft.time == null) ReservationError.SelectTime else null
}
