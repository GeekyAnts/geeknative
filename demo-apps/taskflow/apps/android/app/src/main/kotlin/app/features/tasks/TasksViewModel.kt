package app.features.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.generated.TaskItem
import java.time.LocalDate
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class TasksPhase { Loading, Error, Ready }

enum class TasksBody { Loading, Error, Empty, FilteredEmpty, List }

data class TasksUiState(
    val phase: TasksPhase = TasksPhase.Loading,
    val tasks: List<TaskItem> = emptyList(),
    val filter: TaskFilter = TaskFilter(),
    val refreshing: Boolean = false,
    val updateError: Boolean = false,
    val today: LocalDate = LocalDate.now(),
) {
    val count: Int get() = tasks.size

    val body: TasksBody
        get() = when (phase) {
            TasksPhase.Loading -> TasksBody.Loading
            TasksPhase.Error -> TasksBody.Error
            TasksPhase.Ready -> when {
                tasks.isEmpty() && !filter.isSet -> TasksBody.Empty
                tasks.isEmpty() -> TasksBody.FilteredEmpty
                else -> TasksBody.List
            }
        }
}

/** State and actions for the Tasks screen. The list stays in the order the repository returns. */
class TasksViewModel(
    private val repository: TasksRepository,
    private val today: () -> LocalDate = { LocalDate.now() },
) : ViewModel() {
    private val _uiState = MutableStateFlow(TasksUiState(today = today()))
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()

    private var loadGeneration = 0
    private val toggling = mutableSetOf<String>()

    init {
        load(keepVisible = false)
    }

    /** Called when the screen becomes visible again (back from detail, the editor, or Settings). */
    fun onScreenVisible() = load(keepVisible = _uiState.value.phase == TasksPhase.Ready)

    fun retry() = load(keepVisible = false)

    fun refresh() = load(keepVisible = _uiState.value.phase == TasksPhase.Ready)

    fun selectStatus(status: TaskStatus?) {
        if (_uiState.value.filter.status == status) return
        val keep = _uiState.value.phase == TasksPhase.Ready
        _uiState.update { it.copy(filter = it.filter.copy(status = status)) }
        load(keepVisible = keep)
    }

    fun selectPriority(priority: TaskPriority?) {
        if (_uiState.value.filter.priority == priority) return
        val keep = _uiState.value.phase == TasksPhase.Ready
        _uiState.update { it.copy(filter = it.filter.copy(priority = priority)) }
        load(keepVisible = keep)
    }

    fun clearFilters() {
        if (!_uiState.value.filter.isSet) return
        val keep = _uiState.value.phase == TasksPhase.Ready
        _uiState.update { it.copy(filter = TaskFilter()) }
        load(keepVisible = keep)
    }

    fun dismissUpdateError() {
        _uiState.update { it.copy(updateError = false) }
    }

    /** An open task becomes Done; a Done task becomes To do. The row changes at once. */
    fun toggleStatus(taskId: String) {
        val current = _uiState.value.tasks.find { it.id == taskId } ?: return
        if (!toggling.add(taskId)) return
        val previous = current.status
        val next = if (previous == TaskStatus.Done.wire) TaskStatus.Todo else TaskStatus.Done
        _uiState.update { state ->
            state.copy(
                tasks = state.tasks.map { if (it.id == taskId) it.copy(status = next.wire) else it },
                updateError = false,
            )
        }
        viewModelScope.launch {
            try {
                val saved = repository.updateStatus(taskId, next)
                _uiState.update { state ->
                    state.copy(tasks = state.tasks.map { if (it.id == taskId) saved else it })
                }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                _uiState.update { state ->
                    state.copy(
                        tasks = state.tasks.map { if (it.id == taskId) it.copy(status = previous) else it },
                        updateError = true,
                    )
                }
            } finally {
                toggling.remove(taskId)
            }
        }
    }

    private fun load(keepVisible: Boolean) {
        val generation = ++loadGeneration
        val showLoading = !keepVisible || _uiState.value.phase != TasksPhase.Ready
        _uiState.update {
            it.copy(
                phase = if (showLoading) TasksPhase.Loading else it.phase,
                refreshing = !showLoading,
                today = today(),
            )
        }
        val filter = _uiState.value.filter
        viewModelScope.launch {
            try {
                val tasks = repository.list(filter)
                if (generation != loadGeneration) return@launch
                _uiState.update {
                    it.copy(phase = TasksPhase.Ready, tasks = tasks, refreshing = false, today = today())
                }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                if (generation != loadGeneration) return@launch
                _uiState.update { it.copy(phase = TasksPhase.Error, refreshing = false) }
            }
        }
    }
}
