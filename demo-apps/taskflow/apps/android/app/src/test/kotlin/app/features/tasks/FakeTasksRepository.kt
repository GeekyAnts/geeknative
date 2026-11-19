package app.features.tasks

import app.generated.TaskInput
import app.generated.TaskItem
import java.time.LocalDate
import kotlinx.coroutines.CompletableDeferred

/** Records calls and can fail or pause, for view model tests. Returns tasks in insertion order. */
class FakeTasksRepository(initial: List<TaskItem> = emptyList()) : TasksRepository {
    val listed = mutableListOf<TaskFilter>()
    val statusUpdates = mutableListOf<Pair<String, TaskStatus>>()
    val created = mutableListOf<TaskInput>()
    val updated = mutableListOf<Pair<String, TaskInput>>()
    val deleted = mutableListOf<String>()

    var listError: Throwable? = null
    var getError: Throwable? = null
    var statusError: Throwable? = null
    var createError: Throwable? = null
    var updateError: Throwable? = null
    var deleteError: Throwable? = null

    var listGate: CompletableDeferred<Unit>? = null
    var getGate: CompletableDeferred<Unit>? = null
    var statusGate: CompletableDeferred<Unit>? = null
    var createGate: CompletableDeferred<Unit>? = null
    var updateGate: CompletableDeferred<Unit>? = null
    var deleteGate: CompletableDeferred<Unit>? = null

    private val items = LinkedHashMap<String, TaskItem>().apply {
        initial.forEach { put(it.id, it) }
    }

    override suspend fun list(filter: TaskFilter): List<TaskItem> {
        listed += filter
        listGate?.await()
        listError?.let { throw it }
        return items.values.filter { task ->
            (filter.status == null || task.status == filter.status.wire) &&
                (filter.priority == null || task.priority == filter.priority.wire)
        }
    }

    override suspend fun get(id: String): TaskItem {
        getGate?.await()
        getError?.let { throw it }
        return items[id] ?: throw TaskNotFoundException()
    }

    override suspend fun create(input: TaskInput): TaskItem {
        createGate?.await()
        createError?.let { throw it }
        created += input
        val stamp = "2026-11-18T12:00:00Z"
        val item = TaskItem(
            id = "created-${created.size}",
            title = input.title,
            notes = input.notes,
            status = input.status,
            priority = input.priority,
            dueDate = input.dueDate,
            createdAt = stamp,
            updatedAt = stamp,
        )
        items[item.id] = item
        return item
    }

    override suspend fun update(id: String, input: TaskInput): TaskItem {
        updateGate?.await()
        updateError?.let { throw it }
        updated += id to input
        val current = items[id] ?: throw TaskNotFoundException()
        val saved = current.copy(
            title = input.title,
            notes = input.notes,
            status = input.status,
            priority = input.priority,
            dueDate = input.dueDate,
            updatedAt = "2026-11-18T13:00:00Z",
        )
        items[id] = saved
        return saved
    }

    override suspend fun updateStatus(id: String, status: TaskStatus): TaskItem {
        statusUpdates += id to status
        statusGate?.await()
        statusError?.let { throw it }
        val current = items[id] ?: throw TaskNotFoundException()
        val saved = current.copy(status = status.wire, updatedAt = "2026-11-18T14:00:0${statusUpdates.size}Z")
        items[id] = saved
        return saved
    }

    override suspend fun delete(id: String) {
        deleted += id
        deleteGate?.await()
        deleteError?.let { throw it }
        if (items.remove(id) == null) throw TaskNotFoundException()
    }

    companion object {
        val today: LocalDate = LocalDate.of(2026, 11, 18)
        val samples: List<TaskItem> = TaskSamples.tasks(today)
    }
}
