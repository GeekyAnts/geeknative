package app.testing

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.test.core.app.ApplicationProvider
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation

/** Renders the whole app, with its real navigation, over [container]. */
fun ComposeContentTestRule.launchApp(container: AppContainer = AppContainer.preview()): AppContainer {
    setContent {
        CompositionLocalProvider(LocalAppContainer provides container) {
            AppTheme(darkTheme = false) { AppNavigation() }
        }
    }
    return container
}

private val context get() = ApplicationProvider.getApplicationContext<Context>()

fun string(id: Int, vararg args: Any): String = context.getString(id, *args)

fun plural(id: Int, count: Int): String = context.resources.getQuantityString(id, count, count)
