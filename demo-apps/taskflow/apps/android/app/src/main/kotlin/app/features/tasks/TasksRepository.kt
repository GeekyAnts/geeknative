package app.features.tasks

import app.generated.ApiClient
import app.generated.TaskInput
import app.generated.TaskItem
import app.generated.TaskStatusInput
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.comparisons.nullsLast
import kotlinx.coroutines.CancellationException

/** Reads and writes tasks. Screens use whichever implementation [app.core.AppContainer] provides. */
interface TasksRepository {
    suspend fun list(filter: TaskFilter): List<TaskItem>

    suspend fun get(id: String): TaskItem

    suspend fun create(input: TaskInput): TaskItem

    suspend fun update(id: String, input: TaskInput): TaskItem

    suspend fun updateStatus(id: String, status: TaskStatus): TaskItem

    suspend fun delete(id: String)
}

/**
 * The live repository. Every call goes through the generated [ApiClient]; this class does not
 * open its own HTTP connection. A 404 becomes [TaskNotFoundException].
 */
class ApiTasksRepository : TasksRepository {
    override suspend fun list(filter: TaskFilter): List<TaskItem> = call {
        ApiClient.listTasks(status = filter.status?.wire, priority = filter.priority?.wire)
    }

    override suspend fun get(id: String): TaskItem = call { ApiClient.getTask(id) }

    override suspend fun create(input: TaskInput): TaskItem = call { ApiClient.createTask(input) }

    override suspend fun update(id: String, input: TaskInput): TaskItem = call { ApiClient.updateTask(id, input) }

    override suspend fun updateStatus(id: String, status: TaskStatus): TaskItem = call {
        ApiClient.updateTaskStatus(id, TaskStatusInput(status = status.wire))
    }

    override suspend fun delete(id: String) {
        call { ApiClient.deleteTask(id) }
    }

    private suspend fun <T> call(block: suspend () -> T): T = try {
        block()
    } catch (error: CancellationException) {
        throw error
    } catch (error: Throwable) {
        throw error.taskFailure()
    }
}

/**
 * In-memory tasks for previews, tests, and launches with the `uiTesting` extra.
 * Seeded with [TaskSamples]. Filtering and ordering match the server: open tasks first,
 * then High, Medium, Low, then the earliest due date (none last), then newest first.
 */
class InMemoryTasksRepository(
    today: LocalDate = LocalDate.now(),
    initial: List<TaskItem> = TaskSamples.tasks(today),
) : TasksRepository {
    private val tasks = LinkedHashMap<String, TaskItem>().apply {
        initial.forEach { put(it.id, it) }
    }

    override suspend fun list(filter: TaskFilter): List<TaskItem> = tasks.values
        .filter { task ->
            (filter.status == null || task.status == filter.status.wire) &&
                (filter.priority == null || task.priority == filter.priority.wire)
        }
        .inServerOrder()

    override suspend fun get(id: String): TaskItem = tasks[id] ?: throw TaskNotFoundException()

    override suspend fun create(input: TaskInput): TaskItem {
        val now = Instant.now().toString()
        val created = TaskItem(
            id = UUID.randomUUID().toString(),
            title = input.title,
            notes = input.notes,
            status = input.status,
            priority = input.priority,
            dueDate = input.dueDate,
            createdAt = now,
            updatedAt = now,
        )
        tasks[created.id] = created
        return created
    }

    override suspend fun update(id: String, input: TaskInput): TaskItem {
        val current = tasks[id] ?: throw TaskNotFoundException()
        val updated = current.copy(
            title = input.title,
            notes = input.notes,
            status = input.status,
            priority = input.priority,
            dueDate = input.dueDate,
            updatedAt = Instant.now().toString(),
        )
        tasks[id] = updated
        return updated
    }

    override suspend fun updateStatus(id: String, status: TaskStatus): TaskItem {
        val current = tasks[id] ?: throw TaskNotFoundException()
        val updated = current.copy(status = status.wire, updatedAt = Instant.now().toString())
        tasks[id] = updated
        return updated
    }

    override suspend fun delete(id: String) {
        if (tasks.remove(id) == null) throw TaskNotFoundException()
    }
}

/** The server's list order. Clients that talk to the API don't sort; this one stands in for it. */
internal fun Iterable<TaskItem>.inServerOrder(): List<TaskItem> = sortedWith(
    compareBy<TaskItem> { it.status == TaskStatus.Done.wire }
        .thenBy { priorityRank(it.priority) }
        .thenBy(nullsLast()) { it.dueDate }
        .thenByDescending { it.createdAt },
)

private fun priorityRank(priority: String): Int = when (priority) {
    TaskPriority.High.wire -> 0
    TaskPriority.Medium.wire -> 1
    TaskPriority.Low.wire -> 2
    else -> 3
}
