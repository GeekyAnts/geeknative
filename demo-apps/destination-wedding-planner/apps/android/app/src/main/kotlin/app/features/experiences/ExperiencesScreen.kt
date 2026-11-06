package app.features.experiences

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.EnquireDialog
import app.features.catalog.Experience
import app.features.catalog.formatAmount
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun ExperiencesScreen(viewModel: ExperiencesViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ExperiencesContent(
        experiences = state.experiences,
        activeId = state.activeId,
        enquireSuccess = state.enquireSuccess,
        onOpenEnquiry = viewModel::openEnquiry,
        onCloseEnquiry = viewModel::closeEnquiry,
        onSubmitEnquiry = viewModel::submitEnquiry,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExperiencesContent(
    experiences: List<Experience>,
    activeId: String?,
    enquireSuccess: Boolean,
    onOpenEnquiry: (String) -> Unit,
    onCloseEnquiry: () -> Unit,
    onSubmitEnquiry: (app.features.catalog.EnquiryDraft) -> Unit,
) {
    Box(Modifier.fillMaxSize()) {
    Scaffold(
        containerColor = AppTheme.colors.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.experiences_title)) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = AppTheme.colors.background,
                    titleContentColor = AppTheme.colors.onBackground,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(AppSpacing.lg)
                .testTag("experiences.list"),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            Text(stringResource(R.string.experiences_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
            experiences.forEach { experience ->
                AppCard(modifier = Modifier.testTag("experiences.card.${experience.id}")) {
                    CatalogPhoto(
                        url = experience.imageUrl,
                        contentDescription = experience.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(AppSpacing.xxxl * 4),
                    )
                    Text(experience.name, style = AppTypography.headline)
                    Text(experience.description, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                    Text(
                        stringResource(R.string.experiences_price_from, formatAmount(experience.priceFrom)),
                        style = AppTypography.label,
                    )
                    OutlinedButton(
                        onClick = { onOpenEnquiry(experience.id) },
                        modifier = Modifier.testTag("experiences.enquireCta.${experience.id}"),
                    ) {
                        Text(stringResource(R.string.experiences_enquire_cta))
                    }
                }
            }
        }
    }
    if (activeId != null) {
        EnquireDialog(
            title = stringResource(R.string.experiences_enquire_title),
            successMessage = stringResource(R.string.experiences_enquire_success),
            success = enquireSuccess,
            onDismiss = onCloseEnquiry,
            onSubmit = onSubmitEnquiry,
            formTestTag = "experiences.enquireForm",
            submitTestTag = "experiences.enquireSubmit",
            successTestTag = "experiences.enquireSuccess",
        )
    }
    }
}
