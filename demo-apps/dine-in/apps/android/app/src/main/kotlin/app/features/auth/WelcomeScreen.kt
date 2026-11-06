package app.features.auth

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.GlassLayers
import app.core.designsystem.GlassSurface
import app.core.designsystem.GoldRule
import app.core.designsystem.Overline
import app.core.designsystem.PhotoScrim
import app.core.designsystem.PrimaryButton
import app.core.designsystem.RemoteImage
import app.core.designsystem.SecondaryButton
import app.core.designsystem.appear
import app.core.designsystem.rememberReduceMotion
import app.generated.AppIdentity
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

/** spec/features/auth.md: scale 1 → 1.08 over 20 s, alternating. */
private const val KEN_BURNS_SCALE = 1.08f
private const val KEN_BURNS_MILLIS = 20_000

@Composable
fun WelcomeScreen(viewModel: WelcomeViewModel, onCreateAccount: () -> Unit, onSignIn: () -> Unit) {
    val image by viewModel.welcomeImage.collectAsStateWithLifecycle()
    WelcomeContent(image = image, onCreateAccount = onCreateAccount, onSignIn = onSignIn)
}

@Composable
fun WelcomeContent(image: String?, onCreateAccount: () -> Unit, onSignIn: () -> Unit) {
    val colors = AppTheme.colors
    val reduceMotion = rememberReduceMotion()
    val transition = rememberInfiniteTransition(label = "kenBurns")
    val zoom by transition.animateFloat(
        initialValue = 1f,
        targetValue = KEN_BURNS_SCALE,
        animationSpec = infiniteRepeatable(tween(KEN_BURNS_MILLIS, easing = LinearEasing), RepeatMode.Reverse),
        label = "zoom",
    )
    GlassLayers(
        modifier = Modifier.fillMaxSize().background(colors.espresso),
        content = {
            RemoteImage(
                url = image,
                contentDescription = null,
                placeholderColor = colors.espresso,
                modifier = Modifier.fillMaxSize().graphicsLayer {
                    alpha = 0.6f
                    val scale = if (reduceMotion) 1f else zoom
                    scaleX = scale
                    scaleY = scale
                },
            )
            Box(Modifier.fillMaxSize().background(colors.espresso.copy(alpha = 0.5f)))
            Box(
                Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.35f)
                    .align(Alignment.TopCenter)
                    .background(Brush.verticalGradient(listOf(colors.scrim, colors.scrim.copy(alpha = 0.8f), Color.Transparent))),
            )
            PhotoScrim()
        },
        overlay = {
            Column(
                Modifier.align(Alignment.TopStart).statusBarsPadding().padding(AppSpacing.xl),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            ) {
                Text(AppIdentity.NAME, style = AppSerif.headline, color = colors.onGlassOnImage)
                Overline(stringResource(R.string.brand_tagline), color = colors.onGlassOnImage)
            }
            GlassSurface(
                shape = RoundedCornerShape(AppRadius.xl),
                strong = true,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(AppSpacing.lg)
                    .fillMaxWidth()
                    .appear(),
            ) {
                Column(Modifier.padding(AppSpacing.xl), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    Overline(stringResource(R.string.welcome_overline))
                    GoldRule()
                    Text(stringResource(R.string.welcome_title), style = AppSerif.hero, color = colors.onSurface)
                    Text(stringResource(R.string.welcome_body), style = AppTypography.body, color = colors.onSurfaceVariant)
                    Spacer(Modifier.height(AppSpacing.sm))
                    PrimaryButton(
                        text = stringResource(R.string.welcome_create_account),
                        onClick = onCreateAccount,
                        modifier = Modifier.fillMaxWidth().testTag("welcome.createAccount"),
                    )
                    SecondaryButton(
                        text = stringResource(R.string.welcome_sign_in),
                        onClick = onSignIn,
                        modifier = Modifier.fillMaxWidth().testTag("welcome.signIn"),
                    )
                }
            }
        },
    )
}

@Preview
@Composable
private fun WelcomePreview() {
    AppTheme(darkTheme = false) { WelcomeContent(image = null, onCreateAccount = {}, onSignIn = {}) }
}
