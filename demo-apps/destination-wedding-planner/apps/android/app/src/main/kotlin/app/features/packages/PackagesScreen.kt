package app.features.packages

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTextField
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.GlassPanel
import app.features.catalog.BudgetBreakdown
import app.features.catalog.Experience
import app.features.catalog.WeddingPackage
import app.features.catalog.formatAmount
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun PackagesScreen(
    viewModel: PackagesViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    PackagesContent(
        state = state,
        onBack = onBack,
        onSelectPackage = viewModel::selectPackage,
        onGuestsChange = viewModel::setGuests,
        onToggleAddon = viewModel::toggleAddon,
        onChoose = viewModel::choosePackage,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PackagesContent(
    state: PackagesUiState,
    onBack: () -> Unit,
    onSelectPackage: (String) -> Unit,
    onGuestsChange: (String) -> Unit,
    onToggleAddon: (String) -> Unit,
    onChoose: () -> Unit,
) {
    Scaffold(
        containerColor = AppTheme.colors.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.packages_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back), modifier = Modifier.size(AppIconSize.md))
                    }
                },
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
                .padding(AppSpacing.lg),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            Text(stringResource(R.string.packages_body), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
            Column(
                modifier = Modifier.testTag("packages.list"),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                state.packages.forEach { item ->
                    PackageCard(
                        item = item,
                        selected = item.id == state.selectedId,
                        onClick = { onSelectPackage(item.id) },
                    )
                }
            }
            GlassPanel {
                AppTextField(
                    value = state.guests,
                    onValueChange = onGuestsChange,
                    label = stringResource(R.string.packages_guests),
                    modifier = Modifier.testTag("packages.guests"),
                    keyboardType = KeyboardType.Number,
                )
                Text(stringResource(R.string.packages_addons), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                state.experiences.forEach { experience ->
                    AddonRow(
                        experience = experience,
                        selected = experience.id in state.addons,
                        onToggle = { onToggleAddon(experience.id) },
                    )
                }
                Breakdown(breakdown = state.breakdown)
                Button(
                    onClick = onChoose,
                    modifier = Modifier
                        .testTag("packages.selectCta")
                        .fillMaxWidth(),
                ) {
                    Text(
                        stringResource(
                            if (state.storedPackageId == state.selectedId) R.string.packages_selected else R.string.packages_select_cta,
                        ),
                    )
                }
            }
        }
    }
}

@Composable
private fun PackageCard(item: WeddingPackage, selected: Boolean, onClick: () -> Unit) {
    val border = if (selected) Modifier.border(2.dp, AppTheme.colors.primary, RoundedCornerShape(AppRadius.lg)) else Modifier
    AppCard(
        modifier = Modifier
            .then(border)
            .testTag("packages.card.${item.id}")
            .clickable(onClick = onClick),
    ) {
        CatalogPhoto(
            url = item.imageUrl,
            contentDescription = item.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(AppSpacing.xxxl * 4),
        )
        Text(item.name, style = AppTypography.headline)
        Text(item.description, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        Text(formatAmount(item.basePrice), style = AppTypography.title, color = AppTheme.colors.primary)
    }
}

@Composable
private fun AddonRow(experience: Experience, selected: Boolean, onToggle: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = AppSize.touchTarget)
            .toggleable(value = selected, onValueChange = { onToggle() }, role = Role.Checkbox),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        Checkbox(checked = selected, onCheckedChange = null)
        Column {
            Text(experience.name, style = AppTypography.body)
            Text(formatAmount(experience.priceFrom), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
        }
    }
}

@Composable
private fun Breakdown(breakdown: BudgetBreakdown) {
    Column(
        modifier = Modifier.testTag("packages.breakdown"),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        Text(stringResource(R.string.packages_breakdown), style = AppTypography.headline)
        Line(stringResource(R.string.packages_line_venue), breakdown.venue)
        Line(stringResource(R.string.packages_line_accommodation), breakdown.accommodation)
        Line(stringResource(R.string.packages_line_catering), breakdown.catering)
        Line(stringResource(R.string.packages_line_decoration), breakdown.decoration)
        Line(stringResource(R.string.packages_line_photography), breakdown.photography)
        Line(stringResource(R.string.packages_line_experiences), breakdown.experiences)
        Column(modifier = Modifier.testTag("packages.total")) {
            Text(stringResource(R.string.packages_total), style = AppTypography.title)
            Text(formatAmount(breakdown.total), style = AppTypography.title)
        }
    }
}

@Composable
private fun Line(label: String, amount: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = AppTypography.body)
        Text(formatAmount(amount), style = AppTypography.body)
    }
}
