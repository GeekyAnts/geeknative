package app.features.taskdetail

import app.features.tasks.FakeTasksRepository
import app.features.tasks.TaskNotFoundException
import app.features.tasks.TaskStatus
import app.features.tasks.taskFailure
import app.generated.ApiException
import java.io.IOException
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
class TaskDetailViewModelTest {
    private val today = FakeTasksRepository.today
    private val sample = FakeTasksRepository.samples.first { it.id == "sample-1" }

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `AC-task-detail-1 loads the task's title status priority due date notes and dates`() {
        val viewModel = TaskDetailViewModel(FakeTasksRepository(FakeTasksRepository.samples), sample.id, today = { today })
        val task = viewModel.uiState.value.task
        assertEquals(TaskDetailPhase.Ready, viewModel.uiState.value.phase)
        assertEquals("Finalize Q4 product roadmap", task?.title)
        assertEquals(TaskStatus.InProgress.wire, task?.status)
        assertEquals("high", task?.priority)
        assertEquals(today.plusDays(1).toString(), task?.dueDate)
        assertEquals("", task?.notes)
        assertTrue(task?.createdAt?.isNotBlank() == true)
        assertTrue(task?.updatedAt?.isNotBlank() == true)
    }

    @Test
    fun `AC-task-detail-2 saving a status shows the returned task and failure restores it`() {
        val repository = FakeTasksRepository(listOf(sample))
        val viewModel = TaskDetailViewModel(repository, sample.id, today = { today })
        val gate = CompletableDeferred<Unit>()
        repository.statusGate = gate

        viewModel.selectStatus(TaskStatus.Done)
        assertEquals(TaskStatus.Done.wire, viewModel.uiState.value.task?.status)
        assertTrue(viewModel.uiState.value.busy)
        gate.complete(Unit)
        assertEquals("2026-11-18T14:00:01Z", viewModel.uiState.value.task?.updatedAt)
        assertEquals(TaskStatus.Done, repository.statusUpdates.single().second)
        assertFalse(viewModel.uiState.value.busy)

        repository.statusError = IOException("nope")
        val failed = CompletableDeferred<Unit>()
        repository.statusGate = failed
        viewModel.selectStatus(TaskStatus.Todo)
        assertEquals(TaskStatus.Todo.wire, viewModel.uiState.value.task?.status)
        failed.complete(Unit)
        assertEquals(TaskStatus.Done.wire, viewModel.uiState.value.task?.status)
        assertEquals(TaskDetailMessage.UpdateError, viewModel.uiState.value.message)
    }

    @Test
    fun `AC-task-detail-3 confirming delete removes the task and cancelling keeps it`() {
        val repository = FakeTasksRepository(listOf(sample))
        val viewModel = TaskDetailViewModel(repository, sample.id, today = { today })

        viewModel.requestDelete()
        assertTrue(viewModel.uiState.value.confirmDelete)
        viewModel.cancelDelete()
        assertFalse(viewModel.uiState.value.confirmDelete)
        assertTrue(repository.deleted.isEmpty())
        assertEquals(sample.id, viewModel.uiState.value.task?.id)

        viewModel.requestDelete()
        viewModel.confirmDelete()
        assertEquals(listOf(sample.id), repository.deleted)
        assertTrue(viewModel.uiState.value.deleted)
        assertFalse(viewModel.uiState.value.confirmDelete)
    }

    @Test
    fun `AC-task-detail-4 loading, a failed load with retry, and a 404 is not found`() {
        assertTrue(ApiException(404, "missing").taskFailure() is TaskNotFoundException)

        val hanging = FakeTasksRepository(listOf(sample))
        val gate = CompletableDeferred<Unit>()
        hanging.getGate = gate
        val loading = TaskDetailViewModel(hanging, sample.id, today = { today })
        assertEquals(TaskDetailPhase.Loading, loading.uiState.value.phase)
        gate.complete(Unit)
        assertEquals(TaskDetailPhase.Ready, loading.uiState.value.phase)

        val failing = FakeTasksRepository(listOf(sample))
        failing.getError = IOException("down")
        val errored = TaskDetailViewModel(failing, sample.id, today = { today })
        assertEquals(TaskDetailPhase.Error, errored.uiState.value.phase)
        failing.getError = null
        errored.retry()
        assertEquals(sample.title, errored.uiState.value.task?.title)

        val missing = TaskDetailViewModel(FakeTasksRepository(), "gone", today = { today })
        assertEquals(TaskDetailPhase.NotFound, missing.uiState.value.phase)
        assertNull(missing.uiState.value.task)
    }

    @Test
    fun `AC-task-detail-6 a failed delete stays on the task and shows the delete error`() {
        val repository = FakeTasksRepository(listOf(sample))
        repository.deleteError = IOException("nope")
        val viewModel = TaskDetailViewModel(repository, sample.id, today = { today })

        viewModel.requestDelete()
        viewModel.confirmDelete()

        assertFalse(viewModel.uiState.value.deleted)
        assertEquals(TaskDetailPhase.Ready, viewModel.uiState.value.phase)
        assertEquals(sample.id, viewModel.uiState.value.task?.id)
        assertEquals(TaskDetailMessage.DeleteError, viewModel.uiState.value.message)
        assertEquals(listOf(sample.id), repository.deleted)
    }
}
