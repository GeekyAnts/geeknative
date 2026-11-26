package app.features.tasks

import androidx.annotation.StringRes
import app.R
import app.generated.TaskItem
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

/** A task's status. [wire] is the value the API sends and stores. */
enum class TaskStatus(val wire: String, @StringRes val label: Int) {
    Todo("todo", R.string.task_status_todo),
    InProgress("inProgress", R.string.task_status_in_progress),
    Done("done", R.string.task_status_done);

    companion object {
        fun fromWire(value: String): TaskStatus = entries.firstOrNull { it.wire == value } ?: Todo
    }
}

/** A task's priority. [wire] is the value the API sends and stores. */
enum class TaskPriority(val wire: String, @StringRes val label: Int) {
    Low("low", R.string.task_priority_low),
    Medium("medium", R.string.task_priority_medium),
    High("high", R.string.task_priority_high);

    companion object {
        fun fromWire(value: String): TaskPriority = entries.firstOrNull { it.wire == value } ?: Medium
    }
}

/** What Tasks asks the server for. A null status or priority means "no filter". */
data class TaskFilter(
    val status: TaskStatus? = null,
    val priority: TaskPriority? = null,
) {
    val isSet: Boolean get() = status != null || priority != null
}

/** The server answered 404: the task is gone. */
class TaskNotFoundException : Exception()

/** Turns an API failure into [TaskNotFoundException] when the server reports 404. */
internal fun Throwable.taskFailure(): Throwable =
    if (this is app.generated.ApiException && status == 404) TaskNotFoundException() else this

/**
 * Calendar dates for tasks. A due date is a local `YYYY-MM-DD`, never a UTC instant,
 * so the same day shows in every time zone.
 */
object TaskDates {
    fun parse(value: String): LocalDate = LocalDate.parse(value)

    fun format(date: LocalDate): String = date.toString()

    fun formatMedium(date: LocalDate, locale: Locale = Locale.getDefault()): String =
        date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale))

    fun formatLong(date: LocalDate, locale: Locale = Locale.getDefault()): String =
        date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(locale))

    /** Medium date and short time in the device's zone, for created and updated timestamps. */
    fun formatTimestamp(
        iso: String,
        zone: ZoneId = ZoneId.systemDefault(),
        locale: Locale = Locale.getDefault(),
    ): String {
        val dateTime = Instant.parse(iso).atZone(zone)
        return DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT)
            .withLocale(locale)
            .format(dateTime)
    }

    /** Material's date picker speaks UTC midnights. Map those to the calendar date and back. */
    fun toEpochMillis(date: LocalDate): Long =
        date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()

    fun fromEpochMillis(millis: Long): LocalDate =
        Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()

    /** Overdue when it isn't Done and its due date is before [today]. */
    fun isOverdue(status: String, dueDate: String?, today: LocalDate): Boolean {
        if (status == TaskStatus.Done.wire) return false
        val due = dueDate?.let(::parse) ?: return false
        return due.isBefore(today)
    }

    fun isOverdue(task: TaskItem, today: LocalDate): Boolean = isOverdue(task.status, task.dueDate, today)
}

/**
 * The four sample tasks from spec/features/tasks.md. Dates are relative to [today].
 * Notes are empty: the spec table doesn't include any. Created and updated at 09:00 UTC on [today].
 */
object TaskSamples {
    fun tasks(today: LocalDate): List<TaskItem> = listOf(
        task(
            id = "sample-1",
            title = "Finalize Q4 product roadmap",
            status = TaskStatus.InProgress,
            priority = TaskPriority.High,
            due = today.plusDays(1),
            now = today,
        ),
        task(
            id = "sample-2",
            title = "Fix crash when uploading large attachments",
            status = TaskStatus.Todo,
            priority = TaskPriority.High,
            due = today.minusDays(1),
            now = today,
        ),
        task(
            id = "sample-3",
            title = "Prepare slides for the all-hands",
            status = TaskStatus.Todo,
            priority = TaskPriority.Medium,
            due = today.plusDays(3),
            now = today,
        ),
        task(
            id = "sample-4",
            title = "Renew the SSL certificate for staging",
            status = TaskStatus.Done,
            priority = TaskPriority.Low,
            due = null,
            now = today,
        ),
    )

    private fun task(
        id: String,
        title: String,
        status: TaskStatus,
        priority: TaskPriority,
        due: LocalDate?,
        now: LocalDate,
    ) = TaskItem(
        id = id,
        title = title,
        notes = "",
        status = status.wire,
        priority = priority.wire,
        dueDate = due?.toString(),
        createdAt = stamp(now),
        updatedAt = stamp(now),
    )

    private fun stamp(day: LocalDate): String =
        day.atTime(9, 0).toInstant(ZoneOffset.UTC).toString()
}
