package app.features.destinations

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.GlassPanel
import app.features.catalog.Destination
import app.features.catalog.Venue
import app.features.catalog.WeddingPackage
import app.features.catalog.WeddingStyle
import app.features.catalog.formatAmount
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun DestinationDetailScreen(
    viewModel: DestinationDetailViewModel,
    onBack: () -> Unit,
    onOpenVenue: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val destination = state.destination ?: return
    DestinationDetailContent(
        destination = destination,
        venues = state.venues,
        packages = state.packages,
        saved = state.saved,
        onBack = onBack,
        onToggleSaved = viewModel::toggleSaved,
        onOpenVenue = onOpenVenue,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun DestinationDetailContent(
    destination: Destination,
    venues: List<Venue>,
    packages: List<WeddingPackage>,
    saved: Boolean,
    onBack: () -> Unit,
    onToggleSaved: () -> Unit,
    onOpenVenue: (String) -> Unit,
) {
    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(AppSpacing.xxxl * 6),
            ) {
                CatalogPhoto(
                    url = destination.imageUrl,
                    contentDescription = destination.name,
                    modifier = Modifier.fillMaxSize(),
                )
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, AppTheme.colors.onBackground.copy(alpha = 0.8f)),
                            ),
                        ),
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(AppSpacing.lg),
                ) {
                    Text(destination.region, style = AppTypography.caption, color = AppTheme.colors.tertiary)
                    Text(destination.name, style = AppTypography.headline, color = AppTheme.colors.inverse)
                    Text(destination.tagline, style = AppTypography.title, color = AppTheme.colors.inverse.copy(alpha = 0.9f))
                }
            }
            Column(
                modifier = Modifier.padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                Text(destination.description, style = AppTypography.body)
                Text(destination.seasonalNote, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                StyleAndFacts(destination)
                destination.gallery.forEach { url ->
                    CatalogPhoto(
                        url = url,
                        contentDescription = destination.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(AppSpacing.xxxl * 4),
                    )
                }
                GlassPanel {
                    IconButton(
                        onClick = onToggleSaved,
                        modifier = Modifier.testTag("destinations.save"),
                    ) {
                        Icon(
                            AppIcons.heart,
                            contentDescription = stringResource(if (saved) R.string.destinations_unsave else R.string.destinations_save),
                            modifier = Modifier.size(AppIconSize.md),
                            tint = if (saved) AppTheme.colors.primary else AppTheme.colors.onSurface,
                        )
                    }
                    Text(
                        stringResource(if (saved) R.string.common_saved else R.string.destinations_save),
                        style = AppTypography.label,
                    )
                }
                Column(
                    modifier = Modifier.testTag("destinations.venues"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    Text(stringResource(R.string.destinations_venues_title), style = AppTypography.headline)
                    venues.forEach { venue ->
                        AppCard(modifier = Modifier.clickable { onOpenVenue(venue.id) }) {
                            CatalogPhoto(
                                url = venue.imageUrl,
                                contentDescription = venue.name,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(AppSpacing.xxxl * 3),
                            )
                            Text(venue.name, style = AppTypography.title)
                            Text(
                                stringResource(R.string.venues_price_from, formatAmount(venue.priceFrom)),
                                style = AppTypography.label,
                                color = AppTheme.colors.onSurfaceVariant,
                            )
                        }
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    Text(stringResource(R.string.destinations_packages_title), style = AppTypography.headline)
                    packages.forEach { item ->
                        Text(item.name, style = AppTypography.body)
                    }
                }
            }
        }
        TopAppBar(
            title = { Text(destination.name) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        AppIcons.back,
                        contentDescription = stringResource(R.string.common_back),
                        modifier = Modifier.size(AppIconSize.md),
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent,
                titleContentColor = AppTheme.colors.inverse,
                navigationIconContentColor = AppTheme.colors.inverse,
            ),
            modifier = Modifier.statusBarsPadding(),
        )
    }
}

@Composable
private fun StyleAndFacts(destination: Destination) {
    destination.styles.forEach { id ->
        WeddingStyle.fromId(id)?.let { Text(stringResource(it.label), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant) }
    }
    Text(stringResource(R.string.destinations_capacity, destination.guestCapacityMax), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
    Text(stringResource(R.string.destinations_budget_from, formatAmount(destination.budgetMin)), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
}
