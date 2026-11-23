package app.features.settings

import androidx.annotation.StringRes
import app.R

/** The appearance setting. Stored as these exact [id]s on every platform. */
enum class Appearance(val id: String, @StringRes val label: Int) {
    System("system", R.string.settings_appearance_system),
    Light("light", R.string.settings_appearance_light),
    Dark("dark", R.string.settings_appearance_dark);

    /** Whether to render dark, given the system setting. */
    fun isDark(systemIsDark: Boolean): Boolean = this == Dark || (this == System && systemIsDark)

    companion object {
        /** Storage key, shared with the iOS and web apps. */
        const val STORAGE_KEY = "settings.appearance"

        /** A missing or unknown stored value counts as [System]. */
        fun fromId(id: String?): Appearance = entries.firstOrNull { it.id == id } ?: System
    }
}
