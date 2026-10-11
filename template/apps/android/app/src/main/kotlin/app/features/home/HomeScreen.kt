package app.features.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.generated.AppIcons
import app.generated.AppIdentity
import app.generated.AppSpacing
import app.generated.AppTypography

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(onOpenSettings: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(AppIdentity.NAME) },
                actions = {
                    IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("home.openSettings")) {
                        Icon(AppIcons.settings, contentDescription = stringResource(R.string.home_open_settings))
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(AppSpacing.lg),
        ) {
            AppCard {
                Text(stringResource(R.string.home_welcome_title), style = AppTypography.title)
                Text(
                    stringResource(R.string.home_welcome_body),
                    style = AppTypography.body,
                    color = AppTheme.colors.onSurfaceVariant,
                )
            }
        }
    }
}

@Preview
@Composable
private fun HomeScreenPreview() {
    AppTheme(darkTheme = false) {
        HomeScreen(onOpenSettings = {})
    }
}
