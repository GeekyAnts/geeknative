package app.features.catalog

import android.content.res.Resources
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalResources
import app.R
import java.text.Normalizer
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month
import java.util.Locale

/**
 * Dates, times, prices and ratings built from contracts/strings rather than platform locale
 * formatters, so all three apps print exactly the same text (spec/features/catalog.md).
 */
class Formatters(private val resources: Resources) {
    fun dateShort(date: LocalDate): String = resources.getString(
        R.string.format_date_short,
        resources.getString(weekdayShort(date.dayOfWeek)),
        date.dayOfMonth,
        resources.getString(monthShort(date.month)),
    )

    fun dateLong(date: LocalDate): String = resources.getString(
        R.string.format_date_long,
        resources.getString(weekday(date.dayOfWeek)),
        date.dayOfMonth,
        resources.getString(month(date.month)),
        date.year,
    )

    fun monthYear(date: LocalDate): String =
        resources.getString(R.string.format_month_year, resources.getString(month(date.month)), date.year)

    /** "19:30" → "7:30 PM". */
    fun time(time: String): String {
        val (hour, minute) = time.split(":").map { it.toInt() }
        val hour12 = if (hour % 12 == 0) 12 else hour % 12
        val period = resources.getString(if (hour < 12) R.string.format_am else R.string.format_pm)
        return resources.getString(R.string.format_time, hour12, String.format(Locale.ROOT, "%02d", minute), period)
    }

    fun timeRange(start: String, end: String): String =
        resources.getString(R.string.format_time_range, time(start), time(end))

    fun price(amount: Int): String = resources.getString(R.string.format_price, groupIndian(amount))

    /** The text of `format.price` with an empty amount ("₹"). */
    val priceSymbol: String get() = resources.getString(R.string.format_price, "")

    fun rating(rating: Double): String = Companion.rating(rating)

    fun distance(km: Double): String = resources.getString(R.string.restaurant_distance, String.format(Locale.ROOT, "%.1f", km))

    fun separator(first: String, second: String): String = resources.getString(R.string.format_separator, first, second)

    fun weekdayName(day: DayOfWeek): String = resources.getString(weekday(day))

    fun weekdayShortName(day: DayOfWeek): String = resources.getString(weekdayShort(day))

    companion object {
        /** One decimal with a "." separator: "4.9", "5.0". */
        fun rating(rating: Double): String = String.format(Locale.ROOT, "%.1f", rating)

        /** Indian digit grouping: the last three digits, then pairs (125000 → "1,25,000"). */
        fun groupIndian(amount: Int): String {
            val digits = kotlin.math.abs(amount).toString()
            val sign = if (amount < 0) "-" else ""
            if (digits.length <= 3) return sign + digits
            val last = digits.takeLast(3)
            val rest = digits.dropLast(3)
            val pairs = rest.reversed().chunked(2).map { it.reversed() }.reversed()
            return sign + (pairs + last).joinToString(",")
        }

        fun weekdayShort(day: DayOfWeek): Int = when (day) {
            DayOfWeek.MONDAY -> R.string.date_weekday_short_mon
            DayOfWeek.TUESDAY -> R.string.date_weekday_short_tue
            DayOfWeek.WEDNESDAY -> R.string.date_weekday_short_wed
            DayOfWeek.THURSDAY -> R.string.date_weekday_short_thu
            DayOfWeek.FRIDAY -> R.string.date_weekday_short_fri
            DayOfWeek.SATURDAY -> R.string.date_weekday_short_sat
            DayOfWeek.SUNDAY -> R.string.date_weekday_short_sun
        }

        fun weekday(day: DayOfWeek): Int = when (day) {
            DayOfWeek.MONDAY -> R.string.date_weekday_mon
            DayOfWeek.TUESDAY -> R.string.date_weekday_tue
            DayOfWeek.WEDNESDAY -> R.string.date_weekday_wed
            DayOfWeek.THURSDAY -> R.string.date_weekday_thu
            DayOfWeek.FRIDAY -> R.string.date_weekday_fri
            DayOfWeek.SATURDAY -> R.string.date_weekday_sat
            DayOfWeek.SUNDAY -> R.string.date_weekday_sun
        }

        fun monthShort(month: Month): Int = when (month) {
            Month.JANUARY -> R.string.date_month_short_jan
            Month.FEBRUARY -> R.string.date_month_short_feb
            Month.MARCH -> R.string.date_month_short_mar
            Month.APRIL -> R.string.date_month_short_apr
            Month.MAY -> R.string.date_month_short_may
            Month.JUNE -> R.string.date_month_short_jun
            Month.JULY -> R.string.date_month_short_jul
            Month.AUGUST -> R.string.date_month_short_aug
            Month.SEPTEMBER -> R.string.date_month_short_sep
            Month.OCTOBER -> R.string.date_month_short_oct
            Month.NOVEMBER -> R.string.date_month_short_nov
            Month.DECEMBER -> R.string.date_month_short_dec
        }

        fun month(month: Month): Int = when (month) {
            Month.JANUARY -> R.string.date_month_jan
            Month.FEBRUARY -> R.string.date_month_feb
            Month.MARCH -> R.string.date_month_mar
            Month.APRIL -> R.string.date_month_apr
            Month.MAY -> R.string.date_month_may
            Month.JUNE -> R.string.date_month_jun
            Month.JULY -> R.string.date_month_jul
            Month.AUGUST -> R.string.date_month_aug
            Month.SEPTEMBER -> R.string.date_month_sep
            Month.OCTOBER -> R.string.date_month_oct
            Month.NOVEMBER -> R.string.date_month_nov
            Month.DECEMBER -> R.string.date_month_dec
        }
    }
}

/** The formatters for the current resources. */
@Composable
fun rememberFormatters(): Formatters {
    val resources = LocalResources.current
    return remember(resources) { Formatters(resources) }
}

/** Search text matching: case- and diacritic-insensitive "contains" (spec/features/catalog.md). */
object SearchText {
    private val marks = Regex("\\p{Mn}+")

    fun fold(text: String): String =
        marks.replace(Normalizer.normalize(text.lowercase(Locale.ROOT), Normalizer.Form.NFD), "")

    fun matches(text: String, query: String): Boolean {
        val folded = fold(query.trim())
        return folded.isEmpty() || fold(text).contains(folded)
    }
}
