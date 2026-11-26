package app.features.taskeditor

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelected
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
import app.features.tasks.TaskPriority
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h891dp")
class TaskEditorScreenTest {
    @get:Rule
    val compose = createComposeRule()

    private val today = LocalDate.of(2026, 11, 18)
    private val context = ApplicationProvider.getApplicationContext<Context>()

    private fun string(id: Int) = context.getString(id)

    private fun launch() {
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides AppContainer.preview(today)) {
                AppTheme(darkTheme = false) { AppNavigation() }
            }
        }
    }

    @Test
    fun `AC-task-editor-1 new task opens empty, to do, medium, with no due date`() {
        launch()
        compose.onNodeWithTag("tasks.addButton").performClick()
        compose.onNodeWithText(string(R.string.task_editor_new_title)).assertIsDisplayed()
        val editable = compose.onNodeWithTag("taskEditor.titleField").fetchSemanticsNode()
            .config.getOrNull(SemanticsProperties.EditableText)?.text
        assertEquals("", editable)
        compose.onNode(hasText(string(R.string.task_status_todo)) and isSelected()).assertIsDisplayed()
        compose.onNode(hasText(string(TaskPriority.Medium.label)) and isSelected()).assertIsDisplayed()
        compose.onNodeWithTag("taskEditor.dueDateToggle").assertIsOff()
        compose.onAllNodesWithTag("taskEditor.dueDate").assertCountEquals(0)
        compose.onNodeWithTag("taskEditor.saveButton").assertIsNotEnabled()
    }

    @Test
    fun `AC-task-editor-7 cancel closes the editor without saving`() {
        launch()
        compose.onNodeWithTag("tasks.addButton").performClick()
        compose.onNodeWithTag("taskEditor.titleField").performTextInput("Temporary task")
        compose.onNodeWithTag("taskEditor.cancelButton").performClick()
        compose.onNodeWithTag("tasks.list").assertIsDisplayed()
        compose.onAllNodesWithText("Temporary task").assertCountEquals(0)
        compose.onAllNodesWithText(string(R.string.task_editor_new_title)).assertCountEquals(0)
    }
}
