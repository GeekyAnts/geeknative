package app.core.designsystem

import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Material controls drawn at a size token's height, as on iOS and the web (ControlSize.kt). */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class ControlSizeTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun `buttons and segmented buttons sized with height and ControlContentPadding are drawn at that height, below Material's 40 dp minimum`() {
        compose.setContent {
            AppTheme(darkTheme = false) {
                Button(onClick = {}, modifier = Modifier.testTag("button").height(32.dp), contentPadding = ControlContentPadding) {
                    Text("Go")
                }
                @OptIn(ExperimentalMaterial3Api::class)
                SingleChoiceSegmentedButtonRow {
                    SegmentedButton(
                        selected = true,
                        onClick = {},
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 1),
                        modifier = Modifier.testTag("segment").height(32.dp),
                        contentPadding = ControlContentPadding,
                        label = { Text("Day") },
                    )
                }
            }
        }
        compose.onNodeWithTag("button").assertHeightIsEqualTo(32.dp)
        compose.onNodeWithTag("segment").assertHeightIsEqualTo(32.dp)
    }

    @Test
    fun `switches and checkboxes scaled to a height are drawn at that height`() {
        compose.setContent {
            AppTheme(darkTheme = false) {
                Switch(checked = true, onCheckedChange = null, modifier = Modifier.testTag("switch").scaledToHeight(24.dp))
                Checkbox(checked = true, onCheckedChange = null, modifier = Modifier.testTag("checkbox").scaledToHeight(40.dp))
            }
        }
        compose.onNodeWithTag("switch").assertHeightIsEqualTo(24.dp)
        compose.onNodeWithTag("checkbox").assertHeightIsEqualTo(40.dp)
    }
}
