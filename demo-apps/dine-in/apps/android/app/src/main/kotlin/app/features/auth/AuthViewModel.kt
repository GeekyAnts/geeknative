package app.features.auth

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.R
import app.features.catalog.CatalogRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthMode { SignIn, SignUp }

data class AuthUiState(
    val mode: AuthMode,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val passwordVisible: Boolean = false,
    /** Field errors show only after the first submit attempt, then follow the typing. */
    val submitted: Boolean = false,
    val errors: Map<AuthField, Int> = emptyMap(),
    @StringRes val formError: Int? = null,
    val submitting: Boolean = false,
)

/** Sign in and sign up. A successful submit sets the session; AppNavigation then shows the tabs. */
class AuthViewModel(private val repository: AuthRepository, mode: AuthMode) : ViewModel() {
    private val state = MutableStateFlow(AuthUiState(mode))
    val uiState: StateFlow<AuthUiState> = state.asStateFlow()

    fun setName(value: String) = edit { copy(name = value) }

    fun setEmail(value: String) = edit { copy(email = value) }

    fun setPassword(value: String) = edit { copy(password = value) }

    fun togglePasswordVisible() = state.update { it.copy(passwordVisible = !it.passwordVisible) }

    fun submit() {
        val current = state.value
        if (current.submitting) return
        val errors = validate(current)
        state.update { it.copy(submitted = true, errors = errors, formError = null) }
        if (errors.isNotEmpty()) return
        state.update { it.copy(submitting = true) }
        viewModelScope.launch {
            try {
                when (current.mode) {
                    AuthMode.SignIn -> repository.signIn(current.email, current.password)
                    AuthMode.SignUp -> repository.signUp(current.name, current.email, current.password)
                }
                state.update { it.copy(submitting = false) }
            } catch (e: AuthException) {
                val message = when (e.error) {
                    AuthError.EmailTaken -> R.string.auth_error_email_taken
                    AuthError.InvalidCredentials -> R.string.auth_error_invalid_credentials
                }
                state.update { it.copy(submitting = false, formError = message) }
            }
        }
    }

    private fun edit(change: AuthUiState.() -> AuthUiState) = state.update { old ->
        val next = old.change()
        if (next.submitted) next.copy(errors = validate(next)) else next
    }

    private fun validate(state: AuthUiState) =
        AuthValidator.validate(name = if (state.mode == AuthMode.SignUp) state.name else null, email = state.email, password = state.password)
}

/** The Welcome photograph. */
class WelcomeViewModel(catalog: CatalogRepository) : ViewModel() {
    private val image = MutableStateFlow<String?>(null)
    val welcomeImage: StateFlow<String?> = image.asStateFlow()

    init {
        viewModelScope.launch { image.value = runCatching { catalog.load().welcomeImage }.getOrNull() }
    }
}
