package app.features.home

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import app.R
import app.core.AppContainer
import app.features.cart.CartLine
import app.features.cart.InMemoryCartRepository
import app.features.catalog.LocalCatalogRepository
import app.generated.AppConfig
import app.generated.AppIdentity
import app.testing.launchApp
import app.testing.string
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
// Tall enough to hold all of Home: scrolling to a card inside the nested bestsellers rail is unreliable in Robolectric.
@Config(sdk = [35], qualifiers = "w411dp-h1800dp")
class HomeTest {
    @get:Rule
    val compose = createComposeRule()

    private val catalog = LocalCatalogRepository()

    @Test
    fun `AC-home-1 shows the app name as its title`() {
        compose.launchApp()
        compose.onNodeWithText(AppIdentity.NAME).assertIsDisplayed()
    }

    @Test
    fun `AC-home-2 shows the delivery promise and address`() {
        compose.launchApp()
        compose.onNodeWithTag("home.delivery").assertIsDisplayed()
        compose.onNodeWithText(string(R.string.common_delivery_in, AppConfig.deliveryMinutes)).assertIsDisplayed()
        compose.onNodeWithText(string(R.string.common_delivery_address)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-3 the Settings entry point opens Settings`() {
        compose.launchApp()
        compose.onNodeWithContentDescription(string(R.string.home_open_settings)).assertIsDisplayed()
        compose.onNodeWithTag("home.openSettings").performClick()
        compose.onNodeWithText(string(R.string.settings_title)).assertIsDisplayed()

        // Back returns to Home.
        compose.onNodeWithContentDescription(string(R.string.common_back)).performClick()
        compose.onNodeWithTag("home.delivery").assertIsDisplayed()
    }

    @Test
    fun `AC-home-4 shows all 6 categories and a tile opens that category`() {
        compose.launchApp()
        catalog.categories().forEach { compose.onNodeWithTag("category.${it.id}").performScrollTo().assertIsDisplayed() }

        compose.onNodeWithTag("category.household").performScrollTo().performClick()

        compose.onNodeWithText("Cleaning Essentials").assertIsDisplayed() // the Category screen's title
        compose.onNodeWithTag("product.detergent").assertIsDisplayed()
    }

    @Test
    fun `AC-home-5 shows the bestsellers as product cards`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.home_bestsellers_title)).performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("product.banana").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("product.banana.add").assertExists()
    }

    @Test
    fun `AC-home-6 the search entry opens Search`() {
        compose.launchApp()
        compose.onNodeWithTag("home.search").performClick()
        compose.onNodeWithTag("search.field").assertIsDisplayed()
        compose.onNodeWithTag("search.prompt").assertIsDisplayed()
    }

    @Test
    fun `AC-home-7 the Cart button opens Cart and its badge shows the item count`() {
        compose.launchApp(AppContainer.preview(cartRepository = InMemoryCartRepository(listOf(CartLine("banana", 2), CartLine("milk", 1)))))
        compose.onNodeWithTag("home.cartBadge", useUnmergedTree = true).assertTextEquals("3")
        compose.onNodeWithContentDescription(string(R.string.home_open_cart)).assertIsDisplayed()

        compose.onNodeWithTag("home.openCart").performClick()
        compose.onNodeWithText(string(R.string.cart_title)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-7 the badge is hidden while the cart is empty`() {
        compose.launchApp()
        compose.onNodeWithTag("home.cartBadge", useUnmergedTree = true).assertDoesNotExist()
    }
}
