package app.features.catalog

import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.temporal.ChronoUnit
import java.util.Locale

/** Formats a catalog USD amount for display. */
fun formatAmount(value: Int): String = "$${NumberFormat.getNumberInstance(Locale.US).format(value)}"

fun parsePositiveInt(value: String): Int = value.trim().toIntOrNull()?.takeIf { it > 0 } ?: 0

/** Localized medium date for an ISO yyyy-MM-dd, or empty when unset. */
fun formatIsoDate(value: String): String {
    if (value.isBlank()) return ""
    val date = runCatching { LocalDate.parse(value) }.getOrNull() ?: return value
    return DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.getDefault()).format(date)
}

fun isoDateFromEpochMillis(millis: Long): String =
    Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate().toString()

fun isoDateToEpochMillis(value: String): Long? =
    runCatching { LocalDate.parse(value).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }.getOrNull()

/** Calendar days from today (UTC date) to an ISO yyyy-mm-dd, floored at 0. */
fun daysRemaining(date: String, today: LocalDate = LocalDate.now(ZoneOffset.UTC)): Int {
    if (date.isBlank()) return 0
    val target = runCatching { LocalDate.parse(date) }.getOrNull() ?: return 0
    return ChronoUnit.DAYS.between(today, target).toInt().coerceAtLeast(0)
}
