package app.features.catalog

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/** A reservable time on a date at a restaurant. */
data class Slot(val time: String, val available: Boolean)

enum class TodayAvailability { Available, Full, Closed }

/**
 * The deterministic demonstration availability rule (spec/features/catalog.md), identical on every
 * platform. Pure: `now` is passed in, so tests are deterministic. Times are the device's local time.
 */
object DemoAvailability {
    const val BOOKABLE_DAYS = 30
    private const val SLOT_STEP_MINUTES = 30
    private const val LAST_SEATING_BEFORE_CLOSE_MINUTES = 90
    private const val MIN_LEAD_MINUTES = 60L
    private const val MINUTES_PER_DAY = 24 * 60

    private val dateFormat = DateTimeFormatter.ISO_LOCAL_DATE

    fun isClosed(restaurant: Restaurant, date: LocalDate): Boolean = restaurant.openingHours[date.dayOfWeek] == null

    fun slots(restaurant: Restaurant, date: LocalDate, now: LocalDateTime): List<Slot> {
        val hours = restaurant.openingHours[date.dayOfWeek] ?: return emptyList()
        val open = minutesOf(hours.open)
        var close = minutesOf(hours.close)
        if (close <= open) close += MINUTES_PER_DAY
        val last = close - LAST_SEATING_BEFORE_CLOSE_MINUTES
        val earliest = if (date == now.toLocalDate()) now.plusMinutes(MIN_LEAD_MINUTES) else null
        val day = dateFormat.format(date)
        return (open..last step SLOT_STEP_MINUTES)
            .filter { minutes -> earliest == null || !date.atStartOfDay().plusMinutes(minutes.toLong()).isBefore(earliest) }
            .map { minutes ->
                val time = timeOf(minutes % MINUTES_PER_DAY)
                val unavailable = fnv1a32("${restaurant.id}|$day|$time") % 100 < restaurant.demandPercent
                Slot(time, available = !unavailable)
            }
    }

    fun today(restaurant: Restaurant, now: LocalDateTime): TodayAvailability {
        val today = now.toLocalDate()
        if (isClosed(restaurant, today)) return TodayAvailability.Closed
        return if (slots(restaurant, today, now).any { it.available }) TodayAvailability.Available else TodayAvailability.Full
    }

    /** Today through today + 29 days. */
    fun bookableDates(now: LocalDateTime): List<LocalDate> {
        val today = now.toLocalDate()
        return (0 until BOOKABLE_DAYS).map { today.plusDays(it.toLong()) }
    }

    /** 32-bit FNV-1a over the UTF-8 bytes. */
    fun fnv1a32(text: String): Long {
        var hash = 0x811C9DC5L
        for (byte in text.toByteArray(Charsets.UTF_8)) {
            hash = hash xor (byte.toLong() and 0xFF)
            hash = (hash * 0x01000193L) and 0xFFFFFFFFL
        }
        return hash
    }

    private fun minutesOf(time: String): Int {
        val (hour, minute) = time.split(":").map { it.toInt() }
        return hour * 60 + minute
    }

    private fun timeOf(minutes: Int): String = String.format(Locale.ROOT, "%02d:%02d", minutes / 60, minutes % 60)
}
