package app

import android.app.UiModeManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
import app.features.settings.Appearance

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as App).container

        setContent {
            // Null until the stored choice loads. Skip that first frame rather than flash the wrong theme.
            val appearance by container.settingsRepository.appearance.collectAsStateWithLifecycle(initialValue = null)
            val systemIsDark = isSystemInDarkTheme()

            appearance?.let { chosen ->
                val dark = chosen.isDark(systemIsDark)

                // Tell the system too, so the next cold start (the splash screen before any app code
                // runs) is already in the chosen appearance instead of flashing the system's.
                LaunchedEffect(chosen) { applyToSystem(chosen) }

                // Keep the system bar icons readable when the app's appearance differs from the system's.
                DisposableEffect(dark) {
                    enableEdgeToEdge(
                        statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { dark },
                        navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { dark },
                    )
                    onDispose {}
                }

                CompositionLocalProvider(LocalAppContainer provides container) {
                    AppTheme(darkTheme = dark) {
                        AppNavigation()
                    }
                }
            }
        }
    }

    /** Android 12+ starts the app in this mode; earlier versions have no API for it, so their splash follows the system. */
    private fun applyToSystem(appearance: Appearance) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        val mode = when (appearance) {
            Appearance.System -> UiModeManager.MODE_NIGHT_AUTO
            Appearance.Light -> UiModeManager.MODE_NIGHT_NO
            Appearance.Dark -> UiModeManager.MODE_NIGHT_YES
        }
        getSystemService(UiModeManager::class.java).setApplicationNightMode(mode)
    }
}
