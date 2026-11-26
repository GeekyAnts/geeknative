package app.features.citydetails

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogError
import app.core.designsystem.OverlayBackButton
import app.core.designsystem.OverlayPhotoCard
import app.core.designsystem.PhotoHero
import app.core.designsystem.PrimaryActionButton
import app.core.designsystem.RatingRow
import app.core.designsystem.SaveHeartButton
import app.core.designsystem.SectionHeader
import app.features.catalog.Place
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon

@Composable
fun CityDetailsScreen(
    viewModel: CityDetailsViewModel,
    onBack: () -> Unit,
    onPlanTrip: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    CityDetailsContent(
        state = state,
        onBack = onBack,
        onToggleSave = viewModel::toggleSave,
        onPlanTrip = { state.destination?.let { onPlanTrip(it.id) } },
        onOpenPlace = onOpenPlace,
    )
}

@Composable
fun CityDetailsContent(
    state: CityDetailsUiState,
    onBack: () -> Unit,
    onToggleSave: () -> Unit,
    onPlanTrip: () -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    if (state.notFound || state.destination == null) {
        Column(Modifier.fillMaxSize().statusBarsPadding()) {
            OverlayBackButton(stringResource(R.string.common_back), onBack, Modifier.padding(AppSpacing.sm))
            CatalogError(
                title = stringResource(R.string.city_error_title),
                body = stringResource(R.string.city_error_body),
                onRetry = null,
                testTag = "city.error",
            )
        }
        return
    }
    val destination = state.destination
    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            Box(Modifier.testTag("city.hero")) {
                PhotoHero(
                    imageUrl = destination.imageUrl,
                    fallbackUrl = state.fallbackImageUrl,
                    contentDescription = destination.name,
                    height = AppSize.hero,
                ) {
                    Column(
                        modifier = Modifier.align(Alignment.BottomStart).padding(AppSpacing.lg),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                    ) {
                        Text(destination.name, style = AppTypography.display, color = AppTheme.colors.onOverlay)
                        Text(destination.country, style = AppTypography.label, color = AppTheme.colors.onOverlay)
                    }
                    SaveHeartButton(
                        saved = state.saved,
                        contentDescription = stringResource(if (state.saved) R.string.city_unsave else R.string.city_save),
                        onClick = onToggleSave,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .statusBarsPadding()
                            .padding(AppSpacing.sm)
                            .testTag("city.save"),
                        onPhoto = true,
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = AppSpacing.lg),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                FactCard(stringResource(R.string.city_best_time), destination.bestTimeToVisit)
                FactCard(
                    stringResource(R.string.city_weather),
                    stringResource(R.string.city_weather_value, destination.weather.tempC.toString(), destination.weather.summary),
                )
                FactCard(
                    stringResource(R.string.city_currency),
                    listOf(destination.currency, destination.currencySymbol).filter { it.isNotBlank() }.joinToString(" "),
                )
                FactCard(stringResource(R.string.city_language), destination.language)
            }

            Text(
                destination.description,
                style = AppTypography.body,
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
            )

            PlaceRow(
                title = stringResource(R.string.city_attractions),
                sectionTag = "city.attractions",
                places = state.attractions,
                fallbackUrl = state.fallbackImageUrl,
                onOpenPlace = onOpenPlace,
            )
            PlaceRow(
                title = stringResource(R.string.city_hotels),
                sectionTag = "city.hotels",
                places = state.hotels,
                fallbackUrl = state.fallbackImageUrl,
                onOpenPlace = onOpenPlace,
            )
            PlaceRow(
                title = stringResource(R.string.city_restaurants),
                sectionTag = "city.restaurants",
                places = state.restaurants,
                fallbackUrl = state.fallbackImageUrl,
                onOpenPlace = onOpenPlace,
            )
            PlaceRow(
                title = stringResource(R.string.city_activities),
                sectionTag = "city.activities",
                places = state.activities,
                fallbackUrl = state.fallbackImageUrl,
                onOpenPlace = onOpenPlace,
            )

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(stringResource(R.string.city_tips))
                Column(
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    destination.travelTips.forEach { tip ->
                        AppCard {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                                verticalAlignment = Alignment.Top,
                            ) {
                                Icon(
                                    AppIcons.info,
                                    contentDescription = null,
                                    modifier = Modifier.size(AppIconSize.md),
                                    tint = AppTheme.colors.primary,
                                )
                                Text(tip, style = AppTypography.body)
                            }
                        }
                    }
                }
            }

            PrimaryActionButton(
                text = stringResource(R.string.city_plan_trip),
                onClick = onPlanTrip,
                testTag = "city.planTrip",
                modifier = Modifier.padding(horizontal = AppSpacing.lg).padding(bottom = AppSpacing.xl),
            )
        }
        OverlayBackButton(
            contentDescription = stringResource(R.string.common_back),
            onClick = onBack,
            modifier = Modifier.statusBarsPadding().padding(AppSpacing.sm),
        )
    }
}

@Composable
private fun FactCard(label: String, value: String) {
    AppCard(modifier = Modifier.width(AppSize.cardImage)) {
        Text(label, style = AppTypography.label, color = AppTheme.colors.onSurfaceVariant)
        Text(value, style = AppTypography.body)
    }
}

@Composable
private fun PlaceRow(
    title: String,
    sectionTag: String,
    places: List<Place>,
    fallbackUrl: String,
    onOpenPlace: (String) -> Unit,
) {
    Column(
        modifier = Modifier.testTag(sectionTag),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
    ) {
        SectionHeader(title)
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = AppSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        ) {
            places.forEach { place ->
                OverlayPhotoCard(
                    imageUrl = place.imageUrl,
                    fallbackUrl = fallbackUrl,
                    contentDescription = place.name,
                    modifier = Modifier
                        .width(AppSize.cardImage)
                        .testTag("city.place.${place.id}"), // geeknative-ignore
                    height = AppSize.cardImage,
                    onClick = { onOpenPlace(place.id) },
                ) {
                    Text(place.name, style = AppTypography.title, color = AppTheme.colors.onOverlay)
                    RatingRow(
                        stringResource(R.string.home_rating_label, place.rating.toString()),
                        color = AppTheme.colors.onOverlay,
                    )
                }
            }
        }
    }
}

@Preview
@Composable
private fun CityDetailsScreenPreview() {
    AppTheme(darkTheme = false) {
        CityDetailsContent(
            state = CityDetailsUiState(notFound = true),
            onBack = {},
            onToggleSave = {},
            onPlanTrip = {},
            onOpenPlace = {},
        )
    }
}
