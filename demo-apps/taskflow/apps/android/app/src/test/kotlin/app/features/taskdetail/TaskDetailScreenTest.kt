package app.features.taskdetail

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelected
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.core.app.ApplicationProvider
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
import app.features.tasks.TaskDates
import app.features.tasks.TaskSamples
import java.time.LocalDate
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h891dp")
class TaskDetailScreenTest {
    @get:Rule
    val compose = createComposeRule()

    private val today = LocalDate.of(2026, 11, 18)
    private val context = ApplicationProvider.getApplicationContext<Context>()

    private fun string(id: Int, vararg args: Any) = context.getString(id, *args)

    private fun launch() {
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides AppContainer.preview(today)) {
                AppTheme(darkTheme = false) { AppNavigation() }
            }
        }
    }

    @Test
    fun `AC-task-detail-1 shows title, status, priority, due date, notes and dates`() {
        launch()
        compose.onNodeWithTag("tasks.row.sample-1").performClick()
        val task = TaskSamples.tasks(today).first { it.id == "sample-1" }
        compose.onNodeWithTag("taskDetail.taskTitle").assertTextContains(task.title)
        compose.onNode(hasText(string(R.string.task_status_in_progress)) and isSelected()).assertIsDisplayed()
        compose.onNodeWithTag("taskDetail.priority").assertTextContains(string(R.string.task_priority_high))
        compose.onNodeWithTag("taskDetail.dueDate").assertTextContains(TaskDates.formatLong(today.plusDays(1)))
        compose.onNodeWithTag("taskDetail.notes").assertTextContains(string(R.string.task_detail_no_notes))
        compose.onNodeWithTag("taskDetail.created").assertTextContains(
            string(R.string.task_detail_created, TaskDates.formatTimestamp(task.createdAt)),
        )
        compose.onNodeWithTag("taskDetail.updated").assertTextContains(
            string(R.string.task_detail_updated, TaskDates.formatTimestamp(task.updatedAt)),
        )

        compose.onNode(androidx.compose.ui.test.hasContentDescription(string(R.string.common_back))).performClick()
        compose.onNodeWithTag("tasks.row.sample-4").performScrollTo().performClick()
        compose.onNodeWithTag("taskDetail.dueDate").assertTextContains(string(R.string.task_detail_no_due_date))
        compose.onNodeWithTag("taskDetail.notes").assertTextContains(string(R.string.task_detail_no_notes))
    }

    @Test
    fun `AC-task-detail-3 delete asks, cancel keeps the task, confirm removes it`() {
        launch()
        compose.onNodeWithTag("tasks.row.sample-4").performScrollTo().performClick()
        compose.onNodeWithTag("taskDetail.deleteButton").performScrollTo().performClick()
        compose.onNodeWithText(string(R.string.task_detail_delete_confirm_title)).assertIsDisplayed()
        compose.onNodeWithText(string(R.string.common_cancel)).performClick()
        compose.onNodeWithTag("taskDetail.taskTitle").assertTextContains("Renew the SSL certificate for staging")

        compose.onNodeWithTag("taskDetail.deleteButton").performScrollTo().performClick()
        compose.onNodeWithTag("taskDetail.confirmDelete").performClick()
        compose.onNodeWithTag("tasks.list").assertIsDisplayed()
        compose.onAllNodesWithTag("tasks.row.sample-4").assertCountEquals(0)
    }

    @Test
    fun `AC-task-detail-5 edit opens the editor filled in with this task`() {
        launch()
        compose.onNodeWithTag("tasks.row.sample-1").performClick()
        compose.onNodeWithTag("taskDetail.editButton").performClick()
        compose.onNodeWithText(string(R.string.task_editor_edit_title)).assertIsDisplayed()
        compose.onNodeWithTag("taskEditor.titleField").assertTextContains("Finalize Q4 product roadmap")
    }
}
