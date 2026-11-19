package app.features.taskeditor

import app.features.tasks.FakeTasksRepository
import app.features.tasks.TaskPriority
import app.features.tasks.TaskStatus
import app.generated.TaskItem
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
class TaskEditorViewModelTest {
    private val today = LocalDate.of(2026, 11, 18)

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `AC-task-editor-1 a new task starts empty, to do, medium, with no due date`() {
        val state = TaskEditorViewModel(FakeTasksRepository(), taskId = null, today = { today }).uiState.value
        assertTrue(state.isNew)
        assertEquals("", state.title)
        assertEquals("", state.notes)
        assertEquals(TaskStatus.Todo, state.status)
        assertEquals(TaskPriority.Medium, state.priority)
        assertNull(state.dueDate)
        assertFalse(state.canSave)
        assertNull(state.titleError)
    }

    @Test
    fun `AC-task-editor-2 save stays disabled for a blank, overlong title, or overlong notes`() {
        val viewModel = TaskEditorViewModel(FakeTasksRepository(), taskId = null, today = { today })
        assertFalse(viewModel.uiState.value.canSave)

        viewModel.onTitleChange("x".repeat(TASK_TITLE_MAX + 1))
        assertEquals(TaskEditorTitleError.TooLong, viewModel.uiState.value.titleError)
        assertFalse(viewModel.uiState.value.canSave)

        viewModel.onTitleChange("Ship it")
        viewModel.onNotesChange("n".repeat(TASK_NOTES_MAX + 1))
        assertTrue(viewModel.uiState.value.notesTooLong)
        assertFalse(viewModel.uiState.value.canSave)

        viewModel.onNotesChange("notes")
        assertTrue(viewModel.uiState.value.canSave)
        assertNull(viewModel.uiState.value.titleError)

        viewModel.onTitleChange("   ")
        assertNull(viewModel.uiState.value.titleError)
        viewModel.onTitleFocus(focused = false)
        assertEquals(TaskEditorTitleError.Required, viewModel.uiState.value.titleError)
        assertFalse(viewModel.uiState.value.canSave)
    }

    @Test
    fun `AC-task-editor-3 saving a new task sends the trimmed fields and closes`() {
        val repository = FakeTasksRepository()
        val viewModel = TaskEditorViewModel(repository, taskId = null, today = { today })
        viewModel.onTitleChange("  Buy milk  ")
        viewModel.onNotesChange("  two litres  ")
        viewModel.setStatus(TaskStatus.InProgress)
        viewModel.setPriority(TaskPriority.High)
        viewModel.setDueDateEnabled(true)

        viewModel.save()

        val input = repository.created.single()
        assertEquals("Buy milk", input.title)
        assertEquals("two litres", input.notes)
        assertEquals(TaskStatus.InProgress.wire, input.status)
        assertEquals(TaskPriority.High.wire, input.priority)
        assertEquals(today.toString(), input.dueDate)
        assertTrue(viewModel.uiState.value.saved)
    }

    @Test
    fun `AC-task-editor-4 editing starts from the task and update sends the replacement`() {
        val existing = TaskItem(
            id = "task-9",
            title = "Write the notes",
            notes = "Bring the figures",
            status = TaskStatus.Todo.wire,
            priority = TaskPriority.Low.wire,
            dueDate = today.plusDays(2).toString(),
            createdAt = "2026-11-01T09:00:00Z",
            updatedAt = "2026-11-02T09:00:00Z",
        )
        val repository = FakeTasksRepository(listOf(existing))
        val viewModel = TaskEditorViewModel(repository, existing.id, today = { today })
        val loaded = viewModel.uiState.value
        assertEquals(existing.title, loaded.title)
        assertEquals(existing.notes, loaded.notes)
        assertEquals(TaskStatus.Todo, loaded.status)
        assertEquals(TaskPriority.Low, loaded.priority)
        assertEquals(today.plusDays(2), loaded.dueDate)

        viewModel.onTitleChange("Write the speaker notes")
        viewModel.setStatus(TaskStatus.InProgress)
        viewModel.setPriority(TaskPriority.High)
        viewModel.save()

        val (id, input) = repository.updated.single()
        assertEquals(existing.id, id)
        assertEquals("Write the speaker notes", input.title)
        assertEquals("Bring the figures", input.notes)
        assertEquals(TaskStatus.InProgress.wire, input.status)
        assertEquals(TaskPriority.High.wire, input.priority)
        assertEquals(today.plusDays(2).toString(), input.dueDate)
        assertTrue(viewModel.uiState.value.saved)
    }

    @Test
    fun `AC-task-editor-5 due date on picks today and off saves without one`() {
        val repository = FakeTasksRepository()
        val viewModel = TaskEditorViewModel(repository, taskId = null, today = { today })
        viewModel.setDueDateEnabled(true)
        assertEquals(today, viewModel.uiState.value.dueDate)
        viewModel.onTitleChange("File the report")
        viewModel.save()
        assertEquals(today.toString(), repository.created.single().dueDate)

        val again = TaskEditorViewModel(repository, taskId = null, today = { today })
        again.setDueDateEnabled(true)
        again.setDueDate(today.plusDays(4))
        again.setDueDateEnabled(false)
        again.onTitleChange("File the report")
        again.save()
        assertNull(repository.created.last().dueDate)

        again.setDueDateEnabled(true)
        assertEquals(today.plusDays(4), again.uiState.value.dueDate)
    }

    @Test
    fun `AC-task-editor-6 saving disables save, and a failure keeps the fields`() {
        val repository = FakeTasksRepository()
        val gate = CompletableDeferred<Unit>()
        repository.createGate = gate
        val viewModel = TaskEditorViewModel(repository, taskId = null, today = { today })
        viewModel.onTitleChange("Hello")
        viewModel.onNotesChange("Notes")
        viewModel.setStatus(TaskStatus.InProgress)
        viewModel.setPriority(TaskPriority.High)
        viewModel.setDueDateEnabled(true)
        viewModel.save()

        assertTrue(viewModel.uiState.value.saving)
        assertFalse(viewModel.uiState.value.canSave)

        repository.createError = IOException("nope")
        gate.complete(Unit)
        val state = viewModel.uiState.value
        assertFalse(state.saving)
        assertTrue(state.saveError)
        assertFalse(state.saved)
        assertEquals("Hello", state.title)
        assertEquals("Notes", state.notes)
        assertEquals(TaskStatus.InProgress, state.status)
        assertEquals(TaskPriority.High, state.priority)
        assertEquals(today, state.dueDate)
        assertTrue(state.canSave)
    }
}
