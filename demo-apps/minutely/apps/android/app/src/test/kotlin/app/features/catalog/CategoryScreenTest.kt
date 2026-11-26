package app.features.catalog

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import app.testing.launchApp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h914dp")
class CategoryScreenTest {
    @get:Rule
    val compose = createComposeRule()

    private fun openCategory(id: String) {
        compose.onNodeWithTag("category.$id").performScrollTo().performClick()
    }

    @Test
    fun `AC-catalog-4 choosing a chip shows that category's products`() {
        compose.launchApp()
        openCategory("fruits")

        compose.onNodeWithTag("category.chip.fruits").assertIsSelected()
        compose.onNodeWithTag("product.banana").assertIsDisplayed()
        compose.onNodeWithTag("product.milk").assertDoesNotExist()

        compose.onNodeWithTag("category.chip.dairy").performClick()

        compose.onNodeWithTag("category.chip.dairy").assertIsSelected()
        compose.onNodeWithTag("product.milk").assertIsDisplayed()
        compose.onNodeWithTag("product.banana").assertDoesNotExist()
    }

    @Test
    fun `AC-catalog-5 tapping Add shows the stepper with quantity 1`() {
        compose.launchApp()
        openCategory("fruits")

        compose.onNodeWithTag("product.tomato.add").performClick()

        compose.onNodeWithTag("product.tomato.quantity").assertTextEquals("1")
        compose.onNodeWithTag("product.tomato.add").assertDoesNotExist()
        compose.onNodeWithTag("product.tomato.increase").performClick()
        compose.onNodeWithTag("product.tomato.quantity").assertTextEquals("2")
        compose.onNodeWithTag("product.tomato.decrease").performClick()
        compose.onNodeWithTag("product.tomato.decrease").performClick()
        compose.onNodeWithTag("product.tomato.add").assertIsDisplayed()
    }
}
