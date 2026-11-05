package app.features.auth

import androidx.annotation.StringRes
import app.R

enum class AuthField { Name, Email, Password }

/** Sign-in and sign-up field rules (spec/features/auth.md). */
object AuthValidator {
    private val emailPattern = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    const val MIN_PASSWORD_LENGTH = 8

    @StringRes
    fun nameError(name: String): Int? = if (name.trim().isEmpty()) R.string.auth_error_name_required else null

    @StringRes
    fun emailError(email: String): Int? = if (!emailPattern.matches(email.trim())) R.string.auth_error_email_invalid else null

    @StringRes
    fun passwordError(password: String): Int? = if (password.length < MIN_PASSWORD_LENGTH) R.string.auth_error_password_short else null

    /** Errors per field; empty when the form is valid. Sign in checks only email and password. */
    fun validate(name: String?, email: String, password: String): Map<AuthField, Int> = buildMap {
        if (name != null) nameError(name)?.let { put(AuthField.Name, it) }
        emailError(email)?.let { put(AuthField.Email, it) }
        passwordError(password)?.let { put(AuthField.Password, it) }
    }
}
