package app.core

import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/** ISO 8601 timestamps in UTC with `Z`, as stored in data on every platform. */
object Timestamps {
    private val format = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC)

    fun now(clock: Clock): String = format.format(clock.instant())

    fun parse(text: String): Instant? = runCatching { Instant.parse(text) }.getOrNull()
}
