package app

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation

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
}
