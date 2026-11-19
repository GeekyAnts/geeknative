package app.features.taskdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.tasks.TaskNotFoundException
import app.features.tasks.TaskStatus
import app.features.tasks.TasksRepository
import app.generated.TaskItem
import java.time.LocalDate
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class TaskDetailPhase { Loading, Error, NotFound, Ready }

enum class TaskDetailMessage { UpdateError, DeleteError }

data class TaskDetailUiState(
    val phase: TaskDetailPhase = TaskDetailPhase.Loading,
    val task: TaskItem? = null,
    val busy: Boolean = false,
    val confirmDelete: Boolean = false,
    val message: TaskDetailMessage? = null,
    val deleted: Boolean = false,
    val today: LocalDate = LocalDate.now(),
)

/** State and actions for one task. */
class TaskDetailViewModel(
    private val repository: TasksRepository,
    private val taskId: String,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val _uiState = MutableStateFlow(TaskDetailUiState(today = today()))
    val uiState: StateFlow<TaskDetailUiState> = _uiState.asStateFlow()

    private var loadGeneration = 0

    init {
        load()
    }

    /** Called when the screen becomes visible again, so edits made in the editor show up. */
    fun onScreenVisible() = load(keepContent = _uiState.value.task != null)

    fun retry() = load(keepContent = false)

    fun selectStatus(status: TaskStatus) {
        val task = _uiState.value.task ?: return
        if (_uiState.value.busy || task.status == status.wire) return
        val previous = task.status
        _uiState.update { it.copy(task = task.copy(status = status.wire), busy = true, message = null) }
        viewModelScope.launch {
            try {
                val saved = repository.updateStatus(taskId, status)
                _uiState.update { it.copy(task = saved, busy = false, today = today()) }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                _uiState.update { state ->
                    state.copy(
                        task = state.task?.copy(status = previous),
                        busy = false,
                        message = TaskDetailMessage.UpdateError,
                    )
                }
            }
        }
    }

    fun requestDelete() {
        if (_uiState.value.busy || _uiState.value.task == null) return
        _uiState.update { it.copy(confirmDelete = true) }
    }

    fun cancelDelete() {
        _uiState.update { it.copy(confirmDelete = false) }
    }

    fun confirmDelete() {
        if (_uiState.value.busy) return
        _uiState.update { it.copy(confirmDelete = false, busy = true, message = null) }
        viewModelScope.launch {
            try {
                repository.delete(taskId)
                _uiState.update { it.copy(busy = false, deleted = true) }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                _uiState.update { it.copy(busy = false, message = TaskDetailMessage.DeleteError) }
            }
        }
    }

    fun dismissMessage() {
        _uiState.update { it.copy(message = null) }
    }

    private fun load(keepContent: Boolean = false) {
        val generation = ++loadGeneration
        if (!keepContent) {
            _uiState.update { it.copy(phase = TaskDetailPhase.Loading, task = null, today = today()) }
        }
        viewModelScope.launch {
            try {
                val task = repository.get(taskId)
                if (generation != loadGeneration) return@launch
                _uiState.update { it.copy(phase = TaskDetailPhase.Ready, task = task, today = today()) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: TaskNotFoundException) {
                if (generation != loadGeneration) return@launch
                _uiState.update {
                    it.copy(phase = TaskDetailPhase.NotFound, task = null, busy = false, confirmDelete = false)
                }
            } catch (_: Exception) {
                if (generation != loadGeneration) return@launch
                _uiState.update {
                    it.copy(phase = TaskDetailPhase.Error, task = null, busy = false, confirmDelete = false)
                }
            }
        }
    }
}
