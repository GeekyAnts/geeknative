package app.features.tasks

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
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
import app.generated.AppPlurals
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h891dp")
class TasksScreenTest {
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
    fun `AC-tasks-1 lists each task's title, priority, status and due date in received order`() {
        launch()
        val tags = compose.onAllNodes(rowTag).fetchSemanticsNodes().map { it.config[SemanticsProperties.TestTag] }
        assertEquals(
            listOf("tasks.row.sample-2", "tasks.row.sample-1", "tasks.row.sample-3", "tasks.row.sample-4"),
            tags,
        )

        val overdueDue = string(R.string.task_due, TaskDates.formatMedium(today.minusDays(1)))
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains("Fix crash when uploading large attachments")
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains(string(R.string.task_priority_high))
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains(string(R.string.task_status_todo))
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains(string(R.string.task_overdue))
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains(overdueDue)

        compose.onNodeWithTag("tasks.row.sample-1").assertTextContains("Finalize Q4 product roadmap")
        compose.onNodeWithTag("tasks.row.sample-1").assertTextContains(string(R.string.task_priority_high))
        compose.onNodeWithTag("tasks.row.sample-1").assertTextContains(string(R.string.task_status_in_progress))
        compose.onNodeWithTag("tasks.row.sample-1").assertTextContains(string(R.string.task_due, TaskDates.formatMedium(today.plusDays(1))))
        compose.onNodeWithTag("tasks.row.sample-1").assert(hasText(string(R.string.task_overdue)).not())

        compose.onNodeWithTag("tasks.row.sample-3").assertTextContains("Prepare slides for the all-hands")
        compose.onNodeWithTag("tasks.row.sample-3").assertTextContains(string(R.string.task_priority_medium))
        compose.onNodeWithTag("tasks.row.sample-3").assertTextContains(string(R.string.task_status_todo))
        compose.onNodeWithTag("tasks.row.sample-3").assertTextContains(string(R.string.task_due, TaskDates.formatMedium(today.plusDays(3))))

        compose.onNodeWithTag("tasks.row.sample-4").assertTextContains("Renew the SSL certificate for staging")
        compose.onNodeWithTag("tasks.row.sample-4").assertTextContains(string(R.string.task_priority_low))
        compose.onNodeWithTag("tasks.row.sample-4").assertTextContains(string(R.string.task_status_done))
        compose.onNodeWithTag("tasks.row.sample-4").assert(hasText(overdueDue, substring = true).not())

        compose.onNodeWithTag("tasks.count").assertTextContains(AppPlurals.tasksCount(context.resources, 4))
    }

    @Test
    fun `AC-tasks-7 tapping a toggle marks an open task done and a done task to do`() {
        launch()
        compose.onNodeWithTag("tasks.row.sample-2.toggle").performClick()
        compose.onNodeWithTag("tasks.row.sample-2").assertTextContains(string(R.string.task_status_done))
        compose.onNodeWithTag("tasks.row.sample-2").assert(hasText(string(R.string.task_overdue)).not())

        compose.onNodeWithTag("tasks.row.sample-4.toggle").performScrollTo().performClick()
        compose.onNodeWithTag("tasks.row.sample-4").assertTextContains(string(R.string.task_status_todo))
    }

    @Test
    fun `AC-tasks-10 a row opens task detail and New task opens the editor`() {
        launch()
        compose.onNodeWithTag("tasks.row.sample-1").performClick()
        compose.onNodeWithTag("taskDetail.taskTitle").assertTextContains("Finalize Q4 product roadmap")
        compose.onNode(hasContentDescription(string(R.string.common_back))).performClick()

        compose.onNodeWithTag("tasks.addButton").performClick()
        compose.onNodeWithText(string(R.string.task_editor_new_title)).assertIsDisplayed()
        compose.onNodeWithTag("taskEditor.titleField").assertIsDisplayed()
    }

    @Test
    fun `AC-tasks-11 the settings entry point opens Settings`() {
        launch()
        compose.onNodeWithTag("tasks.openSettings").performClick()
        compose.onNodeWithText(string(R.string.settings_title)).assertIsDisplayed()
    }
}

private val rowTag = androidx.compose.ui.test.SemanticsMatcher("task row") { node ->
    val tag = node.config.getOrNull(SemanticsProperties.TestTag) ?: return@SemanticsMatcher false
    tag.startsWith("tasks.row.") && !tag.endsWith(".toggle")
}
