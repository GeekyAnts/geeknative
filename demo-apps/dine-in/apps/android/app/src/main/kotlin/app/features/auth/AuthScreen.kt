package app.features.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTextField
import app.core.designsystem.AppTheme
import app.core.designsystem.DemoNote
import app.core.designsystem.PrimaryButton
import app.core.designsystem.ScreenHeader
import app.core.designsystem.TextLinkButton
import app.core.designsystem.TopBar
import app.core.designsystem.appear
import app.generated.AppIcons
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun SignInScreen(viewModel: AuthViewModel, onBack: () -> Unit, onSwitch: () -> Unit) = AuthScreen(viewModel, onBack, onSwitch)

@Composable
fun SignUpScreen(viewModel: AuthViewModel, onBack: () -> Unit, onSwitch: () -> Unit) = AuthScreen(viewModel, onBack, onSwitch)

@Composable
private fun AuthScreen(viewModel: AuthViewModel, onBack: () -> Unit, onSwitch: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    AuthContent(
        state = state,
        onName = viewModel::setName,
        onEmail = viewModel::setEmail,
        onPassword = viewModel::setPassword,
        onTogglePassword = viewModel::togglePasswordVisible,
        onSubmit = viewModel::submit,
        onBack = onBack,
        onSwitch = onSwitch,
    )
}

@Composable
fun AuthContent(
    state: AuthUiState,
    onName: (String) -> Unit,
    onEmail: (String) -> Unit,
    onPassword: (String) -> Unit,
    onTogglePassword: () -> Unit,
    onSubmit: () -> Unit,
    onBack: () -> Unit,
    onSwitch: () -> Unit,
) {
    val colors = AppTheme.colors
    val signUp = state.mode == AuthMode.SignUp
    val error = { field: AuthField -> state.errors[field]?.let { it } }
    Column(Modifier.fillMaxSize().background(colors.background)) {
        TopBar(onBack = onBack)
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .imePadding()
                .navigationBarsPadding()
                .padding(horizontal = AppSpacing.lg)
                .padding(bottom = AppSpacing.xl),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            ScreenHeader(
                title = stringResource(if (signUp) R.string.auth_sign_up_title else R.string.auth_sign_in_title),
                subtitle = stringResource(if (signUp) R.string.auth_sign_up_subtitle else R.string.auth_sign_in_subtitle),
                modifier = Modifier.appear(),
            )
            Column(Modifier.appear(1), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                if (signUp) {
                    AppTextField(
                        value = state.name,
                        onValueChange = onName,
                        label = stringResource(R.string.auth_name),
                        leadingIcon = AppIcons.user,
                        error = error(AuthField.Name)?.let { stringResource(it) },
                        enabled = !state.submitting,
                        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, keyboardType = KeyboardType.Text),
                        modifier = Modifier.testTag("auth.name").semantics { contentType = ContentType.PersonFullName },
                    )
                }
                AppTextField(
                    value = state.email,
                    onValueChange = onEmail,
                    label = stringResource(R.string.auth_email),
                    leadingIcon = AppIcons.mail,
                    error = error(AuthField.Email)?.let { stringResource(it) },
                    enabled = !state.submitting,
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.None,
                        autoCorrectEnabled = false,
                        keyboardType = KeyboardType.Email,
                    ),
                    modifier = Modifier.testTag("auth.email").semantics { contentType = ContentType.EmailAddress },
                )
                AppTextField(
                    value = state.password,
                    onValueChange = onPassword,
                    label = stringResource(R.string.auth_password),
                    leadingIcon = AppIcons.lock,
                    error = error(AuthField.Password)?.let { stringResource(it) },
                    supporting = if (signUp) stringResource(R.string.auth_password_hint) else null,
                    enabled = !state.submitting,
                    visualTransformation = if (state.passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(autoCorrectEnabled = false, keyboardType = KeyboardType.Password),
                    trailing = {
                        IconButton(onClick = onTogglePassword, modifier = Modifier.testTag("auth.togglePassword")) {
                            Icon(
                                if (state.passwordVisible) AppIcons.eyeOff else AppIcons.eye,
                                contentDescription = stringResource(if (state.passwordVisible) R.string.auth_hide_password else R.string.auth_show_password),
                                tint = colors.onSurfaceVariant,
                            )
                        }
                    },
                    modifier = Modifier
                        .testTag("auth.password")
                        .semantics { contentType = if (signUp) ContentType.NewPassword else ContentType.Password },
                )
            }
            Column(Modifier.appear(2), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                state.formError?.let {
                    Text(stringResource(it), style = AppTypography.label, color = colors.error, modifier = Modifier.testTag("auth.error"))
                }
                PrimaryButton(
                    text = stringResource(if (signUp) R.string.auth_sign_up_action else R.string.auth_sign_in_action),
                    onClick = onSubmit,
                    busy = state.submitting,
                    modifier = Modifier.fillMaxWidth().testTag("auth.submit"),
                )
                TextLinkButton(
                    text = stringResource(if (signUp) R.string.auth_switch_to_sign_in else R.string.auth_switch_to_sign_up),
                    onClick = onSwitch,
                    modifier = Modifier.align(Alignment.CenterHorizontally).testTag("auth.switch"),
                )
            }
            Spacer(Modifier.height(AppSpacing.sm))
            DemoNote(text = stringResource(R.string.auth_local_note))
        }
    }
}

@Preview
@Composable
private fun SignUpPreview() {
    AppTheme(darkTheme = false) {
        AuthContent(AuthUiState(AuthMode.SignUp), {}, {}, {}, {}, {}, {}, {})
    }
}
