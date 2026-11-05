package app.features.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import app.R
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.PushedScreen
import app.core.designsystem.ScreenHeader
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun HelpScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val title = stringResource(R.string.help_title)
    val email = stringResource(R.string.help_email_address)
    val phone = stringResource(R.string.help_phone_number)
    PushedScreen(onBack = onBack, title = title) {
        item { ScreenHeader(title = title, subtitle = stringResource(R.string.help_body)) }
        item {
            Column(Modifier.clip(RoundedCornerShape(AppRadius.lg)).background(AppTheme.colors.surface)) {
                HelpRow(stringResource(R.string.help_email), email, "help.email") {
                    context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email")))
                }
                HelpRow(stringResource(R.string.help_call), phone, "help.call") {
                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${phone.filter { !it.isWhitespace() }}")))
                }
            }
        }
        item { Text(stringResource(R.string.help_faq_title), style = AppSerif.title, color = AppTheme.colors.onSurface) }
        item { Faq(stringResource(R.string.help_faq_modify_question), stringResource(R.string.help_faq_modify_answer), "help.faq.modify") }
        item { Faq(stringResource(R.string.help_faq_cancel_question), stringResource(R.string.help_faq_cancel_answer), "help.faq.cancel") }
        item { Faq(stringResource(R.string.help_faq_demo_question), stringResource(R.string.help_faq_demo_answer), "help.faq.demo") }
    }
}

@Composable
private fun HelpRow(title: String, detail: String, testId: String, onClick: () -> Unit) {
    val colors = AppTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(AppSpacing.lg)
            .testTag(testId),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs),
    ) {
        Text(title, style = AppTypography.subtitle, color = colors.onSurface)
        Text(detail, style = AppTypography.caption, color = colors.onSurfaceVariant)
    }
}

@Composable
private fun Faq(question: String, answer: String, testId: String) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    val colors = AppTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppRadius.lg))
            .background(colors.surface)
            .clickable { expanded = !expanded }
            .padding(AppSpacing.lg)
            .testTag(testId),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        Text(question, style = AppTypography.subtitle, color = colors.onSurface)
        if (expanded) Text(answer, style = AppTypography.body, color = colors.onSurfaceVariant)
    }
}
