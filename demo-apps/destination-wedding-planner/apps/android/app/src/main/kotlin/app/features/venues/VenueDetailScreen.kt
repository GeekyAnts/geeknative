package app.features.venues

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.EnquireDialog
import app.core.designsystem.GlassPanel
import app.features.catalog.Destination
import app.features.catalog.Venue
import app.features.catalog.WeddingPackage
import app.features.catalog.formatAmount
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun VenueDetailScreen(
    viewModel: VenueDetailViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val venue = state.venue ?: return
    VenueDetailContent(
        venue = venue,
        destination = state.destination,
        packages = state.packages,
        saved = state.saved,
        enquireOpen = state.enquireOpen,
        enquireSuccess = state.enquireSuccess,
        onBack = onBack,
        onToggleSaved = viewModel::toggleSaved,
        onOpenEnquiry = viewModel::openEnquiry,
        onCloseEnquiry = viewModel::closeEnquiry,
        onSubmitEnquiry = viewModel::submitEnquiry,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun VenueDetailContent(
    venue: Venue,
    destination: Destination?,
    packages: List<WeddingPackage>,
    saved: Boolean,
    enquireOpen: Boolean,
    enquireSuccess: Boolean,
    onBack: () -> Unit,
    onToggleSaved: () -> Unit,
    onOpenEnquiry: () -> Unit,
    onCloseEnquiry: () -> Unit,
    onSubmitEnquiry: (app.features.catalog.EnquiryDraft) -> Unit,
) {
    val context = LocalContext.current
    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(AppSpacing.xxxl * 5),
            ) {
                CatalogPhoto(url = venue.imageUrl, contentDescription = venue.name, modifier = Modifier.fillMaxSize())
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(Brush.verticalGradient(listOf(Color.Transparent, AppTheme.colors.onBackground.copy(alpha = 0.8f)))),
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(AppSpacing.lg),
                ) {
                    destination?.let { Text(it.name, style = AppTypography.caption, color = AppTheme.colors.tertiary) }
                    Text(venue.name, style = AppTypography.headline, color = AppTheme.colors.inverse)
                }
            }
            Column(
                modifier = Modifier.padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                GlassPanel {
                    if (enquireSuccess) {
                        Text(
                            stringResource(R.string.venues_enquire_success),
                            style = AppTypography.body,
                            modifier = Modifier.testTag("venues.enquireSuccess"),
                        )
                    }
                    Text(stringResource(R.string.venues_capacity, venue.capacity), style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
                    Text(stringResource(R.string.venues_price_from, formatAmount(venue.priceFrom)), style = AppTypography.headline)
                    Text(
                        stringResource(R.string.venues_rating, venue.rating.toString(), venue.reviewCount),
                        style = AppTypography.caption,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                    Button(
                        onClick = onOpenEnquiry,
                        modifier = Modifier
                            .testTag("venues.enquireCta")
                            .fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.venues_enquire_cta))
                    }
                    OutlinedButton(
                        onClick = onToggleSaved,
                        modifier = Modifier
                            .testTag("venues.save")
                            .fillMaxWidth(),
                    ) {
                        Icon(
                            AppIcons.heart,
                            contentDescription = stringResource(if (saved) R.string.venues_unsave else R.string.venues_save),
                            modifier = Modifier.size(AppIconSize.sm),
                        )
                        Text(stringResource(if (saved) R.string.common_saved else R.string.venues_save))
                    }
                }
                Text(venue.description, style = AppTypography.body)
                venue.gallery.forEach { url ->
                    CatalogPhoto(
                        url = url,
                        contentDescription = venue.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(AppSpacing.xxxl * 4),
                    )
                }
                DetailSection(title = stringResource(R.string.venues_highlights), items = venue.highlights)
                DetailSection(title = stringResource(R.string.venues_spaces), items = venue.spaces)
                DetailSection(title = stringResource(R.string.venues_accommodation), items = listOf(venue.accommodation))
                DetailSection(title = stringResource(R.string.venues_amenities), items = venue.amenities)
                DetailSection(title = stringResource(R.string.venues_packages), items = packages.map { it.name })
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    Text(stringResource(R.string.venues_reviews), style = AppTypography.headline)
                    venue.reviews.forEach { review ->
                        AppCard {
                            Text(review.author, style = AppTypography.title)
                            Text(review.body, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                        }
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    Text(stringResource(R.string.venues_location), style = AppTypography.headline)
                    Text(venue.location, style = AppTypography.body)
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:${venue.latitude},${venue.longitude}"))
                            runCatching { context.startActivity(intent) }
                        },
                        modifier = Modifier.testTag("venues.map"),
                    ) {
                        Icon(AppIcons.map, contentDescription = stringResource(R.string.venues_open_map), modifier = Modifier.size(AppIconSize.sm))
                        Text(stringResource(R.string.venues_open_map))
                    }
                }
            }
        }
        TopAppBar(
            title = { Text(venue.name) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back), modifier = Modifier.size(AppIconSize.md))
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent,
                titleContentColor = AppTheme.colors.inverse,
                navigationIconContentColor = AppTheme.colors.inverse,
            ),
            modifier = Modifier.statusBarsPadding(),
        )
        if (enquireOpen) {
            EnquireDialog(
            title = stringResource(R.string.venues_enquire_title),
            successMessage = stringResource(R.string.venues_enquire_success),
            success = enquireSuccess,
            onDismiss = onCloseEnquiry,
            onSubmit = onSubmitEnquiry,
            formTestTag = "venues.enquireForm",
            submitTestTag = "venues.enquireSubmit",
            successTestTag = "venues.enquireSuccess",
            )
        }
    }
}

@Composable
private fun DetailSection(title: String, items: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
        Text(title, style = AppTypography.headline)
        items.forEach { item ->
            Text(item, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        }
    }
}
