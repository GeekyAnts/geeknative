package app.features.tasks

import app.generated.ApiException
import java.io.IOException
import java.time.LocalDate
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TasksViewModelTest {
    private val today = FakeTasksRepository.today
    private val samples = FakeTasksRepository.samples

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `AC-tasks-1 lists tasks in the order the repository returns`() {
        val reversed = samples.reversed()
        val viewModel = TasksViewModel(FakeTasksRepository(reversed), today = { today })

        assertEquals(reversed.map { it.id }, viewModel.uiState.value.tasks.map { it.id })
        assertEquals(samples[0].title, reversed[3].title)
        assertEquals(TaskPriority.High.wire, viewModel.uiState.value.tasks.first { it.id == "sample-1" }.priority)
        assertEquals(TaskStatus.InProgress.wire, viewModel.uiState.value.tasks.first { it.id == "sample-1" }.status)
        assertEquals(today.plusDays(1).toString(), viewModel.uiState.value.tasks.first { it.id == "sample-1" }.dueDate)
        assertNull(viewModel.uiState.value.tasks.first { it.id == "sample-4" }.dueDate)
    }

    @Test
    fun `AC-tasks-2 shows loading, then the error state, and retry loads the tasks`() {
        val hanging = FakeTasksRepository(samples)
        val gate = CompletableDeferred<Unit>()
        hanging.listGate = gate
        val loading = TasksViewModel(hanging, today = { today })
        assertEquals(TasksBody.Loading, loading.uiState.value.body)
        gate.complete(Unit)
        assertEquals(TasksBody.List, loading.uiState.value.body)

        val failing = FakeTasksRepository(samples)
        failing.listError = IOException("down")
        val errored = TasksViewModel(failing, today = { today })
        assertEquals(TasksBody.Error, errored.uiState.value.body)
        failing.listError = null
        errored.retry()
        assertEquals(TasksBody.List, errored.uiState.value.body)
        assertEquals(listOf("sample-1", "sample-2", "sample-3", "sample-4"), errored.uiState.value.tasks.map { it.id })
    }

    @Test
    fun `AC-tasks-3 empty state when there are no tasks and no filter`() {
        val viewModel = TasksViewModel(FakeTasksRepository(), today = { today })
        assertEquals(TasksBody.Empty, viewModel.uiState.value.body)
        assertFalse(viewModel.uiState.value.filter.isSet)
    }

    @Test
    fun `AC-tasks-4 status filter requests only that status`() {
        val repository = FakeTasksRepository(samples)
        val viewModel = TasksViewModel(repository, today = { today })

        viewModel.selectStatus(TaskStatus.InProgress)
        val filtered = repository.listed.last()
        assertEquals(TaskStatus.InProgress, filtered.status)
        assertNull(filtered.priority)
        assertEquals(listOf("sample-1"), viewModel.uiState.value.tasks.map { it.id })

        viewModel.selectStatus(null)
        assertNull(repository.listed.last().status)
        assertEquals(samples.map { it.id }, viewModel.uiState.value.tasks.map { it.id })
    }

    @Test
    fun `AC-tasks-5 priority filter combines with the status filter`() {
        val repository = FakeTasksRepository(samples)
        val viewModel = TasksViewModel(repository, today = { today })

        viewModel.selectStatus(TaskStatus.Todo)
        viewModel.selectPriority(TaskPriority.High)
        val filtered = repository.listed.last()
        assertEquals(TaskStatus.Todo, filtered.status)
        assertEquals(TaskPriority.High, filtered.priority)
        assertEquals(listOf("sample-2"), viewModel.uiState.value.tasks.map { it.id })
    }

    @Test
    fun `AC-tasks-6 filtered empty state and clear filters shows every task`() {
        val viewModel = TasksViewModel(FakeTasksRepository(samples), today = { today })
        viewModel.selectStatus(TaskStatus.Done)
        viewModel.selectPriority(TaskPriority.High)

        assertEquals(TasksBody.FilteredEmpty, viewModel.uiState.value.body)
        viewModel.clearFilters()
        assertFalse(viewModel.uiState.value.filter.isSet)
        assertEquals(TasksBody.List, viewModel.uiState.value.body)
        assertEquals(4, viewModel.uiState.value.count)
    }

    @Test
    fun `AC-tasks-7 toggle marks an open task done and a done task to do`() {
        val repository = FakeTasksRepository(samples)
        val viewModel = TasksViewModel(repository, today = { today })
        val gate = CompletableDeferred<Unit>()
        repository.statusGate = gate

        viewModel.toggleStatus("sample-2")
        assertEquals(TaskStatus.Done.wire, viewModel.uiState.value.tasks.first { it.id == "sample-2" }.status)
        gate.complete(Unit)
        assertEquals("sample-2" to TaskStatus.Done, repository.statusUpdates.single())
        assertEquals(
            "2026-11-18T14:00:01Z",
            viewModel.uiState.value.tasks.first { it.id == "sample-2" }.updatedAt,
        )

        val back = CompletableDeferred<Unit>()
        repository.statusGate = back
        viewModel.toggleStatus("sample-4")
        assertEquals(TaskStatus.Todo.wire, viewModel.uiState.value.tasks.first { it.id == "sample-4" }.status)
        back.complete(Unit)
        assertEquals("sample-4" to TaskStatus.Todo, repository.statusUpdates.last())
    }

    @Test
    fun `AC-tasks-8 a failed toggle restores the row and shows the update error`() {
        val repository = FakeTasksRepository(samples)
        val viewModel = TasksViewModel(repository, today = { today })
        val gate = CompletableDeferred<Unit>()
        repository.statusGate = gate
        repository.statusError = IOException("nope")

        viewModel.toggleStatus("sample-2")
        assertEquals(TaskStatus.Done.wire, viewModel.uiState.value.tasks.first { it.id == "sample-2" }.status)
        gate.complete(Unit)
        assertEquals(TaskStatus.Todo.wire, viewModel.uiState.value.tasks.first { it.id == "sample-2" }.status)
        assertTrue(viewModel.uiState.value.updateError)
    }

    @Test
    fun `AC-tasks-9 overdue is an open task due before today`() {
        val viewModel = TasksViewModel(InMemoryTasksRepository(today), today = { today })
        val tasks = viewModel.uiState.value.tasks
        assertTrue(TaskDates.isOverdue(tasks.first { it.id == "sample-2" }, today))
        assertFalse(TaskDates.isOverdue(tasks.first { it.id == "sample-1" }, today))
        assertFalse(TaskDates.isOverdue(tasks.first { it.id == "sample-3" }, today))
        assertFalse(TaskDates.isOverdue(tasks.first { it.id == "sample-4" }, today))
        assertFalse(TaskDates.isOverdue(TaskStatus.Done.wire, today.minusDays(3).toString(), today))
        assertFalse(TaskDates.isOverdue(TaskStatus.Todo.wire, today.toString(), today))
        assertFalse(TaskDates.isOverdue(TaskStatus.InProgress.wire, today.plusDays(1).toString(), today))
        assertFalse(TaskDates.isOverdue(TaskStatus.Todo.wire, null, today))
    }

    @Test
    fun `AC-tasks-12 the count is the number of tasks in the list`() {
        val viewModel = TasksViewModel(InMemoryTasksRepository(today), today = { today })
        assertEquals(4, viewModel.uiState.value.count)
        viewModel.selectStatus(TaskStatus.Done)
        assertEquals(1, viewModel.uiState.value.count)
        viewModel.selectStatus(TaskStatus.Todo)
        assertEquals(2, viewModel.uiState.value.count)
    }

    @Test
    fun `HTTP 404 from the client becomes a not-found error`() {
        assertTrue(ApiException(404, "missing").taskFailure() is TaskNotFoundException)
        assertTrue(ApiException(500, "down").taskFailure() is ApiException)
    }
}
