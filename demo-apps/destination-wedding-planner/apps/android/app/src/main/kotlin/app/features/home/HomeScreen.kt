package app.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import app.R
import app.core.designsystem.AppDateField
import app.core.designsystem.AppTextField
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogPhoto
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.GlassPanel
import app.core.designsystem.shadow
import app.features.catalog.Destination
import app.features.catalog.Experience
import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPackage
import app.features.catalog.formatAmount
import app.generated.AppElevation
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppIdentity
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onOpenSettings: () -> Unit,
    onOpenDestinations: () -> Unit,
    onOpenWedding: () -> Unit,
    onOpenDestination: (String) -> Unit,
    onOpenExperiences: () -> Unit,
    onOpenPackages: () -> Unit,
) {
    HomeContent(
        destinations = viewModel.destinations,
        experiences = viewModel.experiences,
        packages = viewModel.packages,
        heroImageUrl = viewModel.heroImageUrl,
        location = viewModel.location,
        date = viewModel.date,
        guests = viewModel.guests,
        budget = viewModel.budget,
        onLocationChange = viewModel::updateLocation,
        onDateChange = viewModel::updateDate,
        onGuestsChange = viewModel::updateGuests,
        onBudgetChange = viewModel::updateBudget,
        onSubmitSearch = { viewModel.submitSearch(onOpenDestinations) },
        onOpenSettings = onOpenSettings,
        onOpenDestinations = onOpenDestinations,
        onOpenWedding = onOpenWedding,
        onOpenDestination = onOpenDestination,
        onOpenExperiences = onOpenExperiences,
        onOpenPackages = onOpenPackages,
    )
}

@Composable
private fun HomeContent(
    destinations: List<Destination>,
    experiences: List<Experience>,
    packages: List<WeddingPackage>,
    heroImageUrl: String,
    location: String,
    date: String,
    guests: String,
    budget: String,
    onLocationChange: (String) -> Unit,
    onDateChange: (String) -> Unit,
    onGuestsChange: (String) -> Unit,
    onBudgetChange: (String) -> Unit,
    onSubmitSearch: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenDestinations: () -> Unit,
    onOpenWedding: () -> Unit,
    onOpenDestination: (String) -> Unit,
    onOpenExperiences: () -> Unit,
    onOpenPackages: () -> Unit,
) {
    val overlayShadow = Shadow(
        color = AppTheme.colors.onInverse.copy(alpha = 0.45f),
        offset = Offset(0f, 1f),
        blurRadius = 16f,
    )
    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
            Box(Modifier.fillMaxWidth()) {
                CatalogPhoto(
                    url = heroImageUrl,
                    contentDescription = stringResource(R.string.home_hero_image_alt),
                    modifier = Modifier.matchParentSize(),
                )
                Box(
                    Modifier
                        .matchParentSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    AppTheme.colors.onInverse.copy(alpha = 0.55f),
                                    AppTheme.colors.onInverse.copy(alpha = 0.42f),
                                    AppTheme.colors.onInverse.copy(alpha = 0.82f),
                                ),
                            ),
                        ),
                )
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top))
                        .padding(top = AppSize.touchTarget + AppSpacing.lg)
                        .padding(AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
                ) {
                    Text(
                        stringResource(R.string.home_hero_title),
                        style = AppTypography.hero.copy(shadow = overlayShadow),
                        color = AppTheme.colors.inverse,
                    )
                    Text(
                        stringResource(R.string.home_hero_body),
                        style = AppTypography.body.copy(shadow = overlayShadow),
                        color = AppTheme.colors.inverse,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                        Button(
                            onClick = onOpenDestinations,
                            modifier = Modifier
                                .testTag("home.exploreCta")
                                .height(AppSize.touchTarget),
                            contentPadding = ControlContentPadding,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AppTheme.colors.primary,
                                contentColor = AppTheme.colors.onPrimary,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp),
                        ) {
                            Text(stringResource(R.string.home_explore_cta))
                        }
                        OutlinedButton(
                            onClick = onOpenWedding,
                            modifier = Modifier
                                .testTag("home.planCta")
                                .height(AppSize.touchTarget),
                            contentPadding = ControlContentPadding,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AppTheme.colors.inverse),
                        ) {
                            Text(stringResource(R.string.home_plan_cta))
                        }
                    }
                    GlassPanel(modifier = Modifier.testTag("home.search")) {
                        AppTextField(
                            value = location,
                            onValueChange = onLocationChange,
                            label = stringResource(R.string.home_search_location),
                            leadingIcon = AppIcons.mapPin,
                        )
                        AppDateField(
                            value = date,
                            onValueChange = onDateChange,
                            label = stringResource(R.string.home_search_date),
                        )
                        AppTextField(
                            value = guests,
                            onValueChange = onGuestsChange,
                            label = stringResource(R.string.home_search_guests),
                            keyboardType = KeyboardType.Number,
                            leadingIcon = AppIcons.users,
                        )
                        AppTextField(
                            value = budget,
                            onValueChange = onBudgetChange,
                            label = stringResource(R.string.home_search_budget),
                            keyboardType = KeyboardType.Number,
                            leadingIcon = AppIcons.wallet,
                        )
                        Button(
                            onClick = onSubmitSearch,
                            modifier = Modifier
                                .testTag("home.search.submit")
                                .fillMaxWidth()
                                .height(AppSize.touchTarget),
                            contentPadding = ControlContentPadding,
                        ) {
                            Text(stringResource(R.string.home_search_submit))
                        }
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(AppSpacing.lg)
                    .testTag("home.featured"),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
            ) {
                Text(
                    stringResource(R.string.home_featured_title),
                    style = AppTypography.label,
                    color = AppTheme.colors.tertiary,
                )
                Text(stringResource(R.string.home_featured_body), style = AppTypography.display)
                destinations.forEach { destination ->
                    FeaturedDestinationCard(destination = destination, onClick = { onOpenDestination(destination.id) })
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AppTheme.colors.surfaceVariant.copy(alpha = 0.6f))
                    .padding(AppSpacing.lg)
                    .clickable(onClick = onOpenExperiences),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(
                    stringResource(R.string.home_experiences_title),
                    style = AppTypography.label,
                    color = AppTheme.colors.tertiary,
                )
                Text(stringResource(R.string.home_experiences_body), style = AppTypography.display)
                experiences.forEach { experience ->
                    Text(experience.name, style = AppTypography.title)
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(AppSpacing.lg)
                    .clickable(onClick = onOpenPackages),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(
                    stringResource(R.string.home_packages_title),
                    style = AppTypography.label,
                    color = AppTheme.colors.tertiary,
                )
                Text(stringResource(R.string.home_packages_body), style = AppTypography.display)
                packages.forEach { item ->
                    Text(item.name, style = AppTypography.title)
                    Text(formatAmount(item.basePrice), style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top))
                .padding(horizontal = AppSpacing.lg),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                AppIdentity.NAME,
                style = AppTypography.title.copy(shadow = overlayShadow),
                color = AppTheme.colors.inverse,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("home.openSettings")) {
                Icon(
                    AppIcons.settings,
                    contentDescription = stringResource(R.string.home_open_settings),
                    modifier = Modifier.size(AppIconSize.md),
                    tint = AppTheme.colors.inverse,
                )
            }
        }
    }
}

@Composable
private fun FeaturedDestinationCard(destination: Destination, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppRadius.xl))
            .shadow(AppElevation.high, RoundedCornerShape(AppRadius.xl))
            .background(AppTheme.colors.surface)
            .testTag("home.destination.${destination.id}")
            .clickable(onClick = onClick),
    ) {
        Box {
            CatalogPhoto(
                url = destination.imageUrl,
                contentDescription = destination.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(AppSpacing.xxxl * 5),
            )
            Text(
                destination.name,
                style = AppTypography.headline,
                color = AppTheme.colors.inverse,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(AppSpacing.lg),
            )
        }
        Column(Modifier.padding(AppSpacing.lg), verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            Text(destination.tagline, style = AppTypography.title, color = AppTheme.colors.primary)
            Text(destination.description, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
            Text(stringResource(R.string.home_explore_destination), style = AppTypography.label, color = AppTheme.colors.primary)
        }
    }
}

@Preview
@Composable
private fun HomeScreenPreview() {
    AppTheme(darkTheme = false) {
        HomeContent(
            destinations = WeddingCatalog.destinations,
            experiences = WeddingCatalog.experiences.take(3),
            packages = WeddingCatalog.packages,
            heroImageUrl = WeddingCatalog.heroImageUrl,
            location = "",
            date = "",
            guests = "",
            budget = "",
            onLocationChange = {},
            onDateChange = {},
            onGuestsChange = {},
            onBudgetChange = {},
            onSubmitSearch = {},
            onOpenSettings = {},
            onOpenDestinations = {},
            onOpenWedding = {},
            onOpenDestination = {},
            onOpenExperiences = {},
            onOpenPackages = {},
        )
    }
}
