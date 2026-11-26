package app.features.taskeditor

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.tasks.TaskDates
import app.features.tasks.TaskPriority
import app.features.tasks.TaskStatus
import app.features.tasks.TasksRepository
import app.generated.TaskInput
import java.time.LocalDate
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

const val TASK_TITLE_MAX = 120
const val TASK_NOTES_MAX = 2000

enum class TaskEditorTitleError { Required, TooLong }

data class TaskEditorUiState(
    val isNew: Boolean = true,
    val loading: Boolean = false,
    val loadError: Boolean = false,
    val title: String = "",
    val notes: String = "",
    val status: TaskStatus = TaskStatus.Todo,
    val priority: TaskPriority = TaskPriority.Medium,
    val dueDate: LocalDate? = null,
    val titleEdited: Boolean = false,
    val titleBlurred: Boolean = false,
    val saving: Boolean = false,
    val saveError: Boolean = false,
    val saved: Boolean = false,
) {
    /** Shown once the title was typed in and then left empty. Too-long shows immediately. */
    val titleError: TaskEditorTitleError?
        get() = when {
            title.trim().length > TASK_TITLE_MAX -> TaskEditorTitleError.TooLong
            titleEdited && titleBlurred && title.trim().isEmpty() -> TaskEditorTitleError.Required
            else -> null
        }

    val notesTooLong: Boolean get() = notes.length > TASK_NOTES_MAX

    val canSave: Boolean
        get() = !loading && !loadError && !saving &&
            title.trim().isNotEmpty() &&
            title.trim().length <= TASK_TITLE_MAX &&
            notes.length <= TASK_NOTES_MAX
}

/** One form for creating a task and editing an existing one. [taskId] is null for a new task. */
class TaskEditorViewModel(
    private val repository: TasksRepository,
    private val taskId: String?,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        TaskEditorUiState(isNew = taskId == null, loading = taskId != null),
    )
    val uiState: StateFlow<TaskEditorUiState> = _uiState.asStateFlow()

    /** The last date the user picked, kept when the switch is turned off so turning it on restores it. */
    private var chosenDueDate: LocalDate? = null

    init {
        if (taskId != null) load()
    }

    fun retry() {
        if (taskId != null) load()
    }

    fun onTitleChange(value: String) {
        _uiState.update { it.copy(title = value, titleEdited = true, saveError = false) }
    }

    fun onTitleFocus(focused: Boolean) {
        _uiState.update { state ->
            if (focused) state else if (state.titleEdited) state.copy(titleBlurred = true) else state
        }
    }

    fun onNotesChange(value: String) {
        _uiState.update { it.copy(notes = value, saveError = false) }
    }

    fun setStatus(status: TaskStatus) {
        _uiState.update { it.copy(status = status, saveError = false) }
    }

    fun setPriority(priority: TaskPriority) {
        _uiState.update { it.copy(priority = priority, saveError = false) }
    }

    fun setDueDateEnabled(enabled: Boolean) {
        val date = if (enabled) chosenDueDate ?: today() else null
        if (enabled) chosenDueDate = date
        _uiState.update { it.copy(dueDate = date, saveError = false) }
    }

    fun setDueDate(date: LocalDate) {
        chosenDueDate = date
        _uiState.update { it.copy(dueDate = date, saveError = false) }
    }

    fun save() {
        val state = _uiState.value
        if (!state.canSave) return
        val input = TaskInput(
            title = state.title.trim(),
            notes = state.notes.trim(),
            status = state.status.wire,
            priority = state.priority.wire,
            dueDate = state.dueDate?.let(TaskDates::format),
        )
        _uiState.update { it.copy(saving = true, saveError = false) }
        viewModelScope.launch {
            try {
                if (taskId == null) repository.create(input) else repository.update(taskId, input)
                _uiState.update { it.copy(saving = false, saved = true) }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                _uiState.update { it.copy(saving = false, saveError = true) }
            }
        }
    }

    private fun load() {
        val id = taskId ?: return
        _uiState.update { it.copy(loading = true, loadError = false) }
        viewModelScope.launch {
            try {
                val task = repository.get(id)
                val due = task.dueDate?.let(TaskDates::parse)
                chosenDueDate = due
                _uiState.update {
                    it.copy(
                        loading = false,
                        loadError = false,
                        title = task.title,
                        notes = task.notes,
                        status = TaskStatus.fromWire(task.status),
                        priority = TaskPriority.fromWire(task.priority),
                        dueDate = due,
                    )
                }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                _uiState.update { it.copy(loading = false, loadError = true) }
            }
        }
    }
}
