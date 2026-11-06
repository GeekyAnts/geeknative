package app

import android.app.Application
import app.core.AppContainer

class App : Application() {
    /** The app's dependencies, created once at launch. */
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer.live(this)
    }
}
