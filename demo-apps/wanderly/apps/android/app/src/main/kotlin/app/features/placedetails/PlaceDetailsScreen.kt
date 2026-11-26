package app.features.placedetails

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogError
import app.core.designsystem.OverlayBackButton
import app.core.designsystem.PhotoHero
import app.core.designsystem.PhotoScrim
import app.core.designsystem.PrimaryActionButton
import app.core.designsystem.RemoteImage
import app.core.designsystem.SaveHeartButton
import app.core.designsystem.shadow
import app.features.catalog.PlaceKind
import app.generated.AppElevation
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun PlaceDetailsScreen(
    viewModel: PlaceDetailsViewModel,
    onBack: () -> Unit,
    onStartTrip: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    PlaceDetailsContent(
        state = state,
        onBack = onBack,
        onToggleSave = viewModel::toggleSave,
        onAddToTrip = viewModel::openTripSheet,
        onDismissSheet = viewModel::dismissTripSheet,
        onSelectTrip = viewModel::addToTrip,
        onStartTrip = {
            state.place?.let { onStartTrip(it.destinationId) }
            viewModel.dismissTripSheet()
        },
        onAddedShown = viewModel::consumeAddedMessage,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaceDetailsContent(
    state: PlaceDetailsUiState,
    onBack: () -> Unit,
    onToggleSave: () -> Unit,
    onAddToTrip: () -> Unit,
    onDismissSheet: () -> Unit,
    onSelectTrip: (app.features.tripplanner.Trip) -> Unit,
    onStartTrip: () -> Unit,
    onAddedShown: () -> Unit,
) {
    val snackbar = remember { SnackbarHostState() }
    val addedText = stringResource(R.string.place_added)
    LaunchedEffect(state.addedMessage) {
        if (state.addedMessage) {
            snackbar.showSnackbar(addedText)
            onAddedShown()
        }
    }
    if (state.notFound || state.place == null) {
        Column(Modifier.fillMaxSize().statusBarsPadding()) {
            OverlayBackButton(stringResource(R.string.common_back), onBack, Modifier.padding(AppSpacing.sm))
            CatalogError(
                title = stringResource(R.string.place_error_title),
                body = stringResource(R.string.place_error_body),
                onRetry = null,
                testTag = "place.error",
            )
        }
        return
    }
    val place = state.place
    val gallery = listOf(place.imageUrl) + place.gallery
    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            Box(Modifier.testTag("place.hero")) {
                if (gallery.size > 1) {
                    val pager = rememberPagerState(pageCount = { gallery.size })
                    val shape = RoundedCornerShape(AppRadius.xl)
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(AppSize.placeHero)
                            .shadow(AppElevation.low, shape)
                            .clip(shape),
                    ) {
                        HorizontalPager(state = pager, modifier = Modifier.fillMaxSize()) { page ->
                            RemoteImage(
                                url = gallery[page],
                                fallbackUrl = state.fallbackImageUrl,
                                contentDescription = place.name,
                                modifier = Modifier.fillMaxSize(),
                            )
                        }
                        PhotoScrim(Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(AppSize.placeHero / 2))
                        HeroLabels(place.name, place.kind, Modifier.align(Alignment.BottomStart).padding(AppSpacing.lg))
                    }
                } else {
                    PhotoHero(
                        imageUrl = place.imageUrl,
                        fallbackUrl = state.fallbackImageUrl,
                        contentDescription = place.name,
                        height = AppSize.placeHero,
                    ) {
                        HeroLabels(place.name, place.kind, Modifier.align(Alignment.BottomStart).padding(AppSpacing.lg))
                    }
                }
            }

            Column(
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            ) {
                Text(
                    stringResource(R.string.place_rating, place.rating.toString(), place.reviewCount.toString()),
                    style = AppTypography.label,
                    color = AppTheme.colors.accent,
                )
                Text(
                    stringResource(R.string.place_location),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                )
                Text(place.location, style = AppTypography.body)
                Text(
                    stringResource(R.string.place_hours),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                )
                Text(place.openingHours, style = AppTypography.body)
                if (place.durationMinutes > 0) {
                    Text(
                        stringResource(R.string.place_duration, place.durationMinutes.toString()),
                        style = AppTypography.body,
                    )
                }
                if (place.kind == "hotel" && place.pricePerNight != null) {
                    Text(
                        stringResource(
                            R.string.place_price_per_night,
                            state.currencySymbol,
                            place.pricePerNight.toString(),
                        ),
                        style = AppTypography.body,
                    )
                }
                Text(place.description, style = AppTypography.body)
            }

            SaveHeartButton(
                saved = state.saved,
                contentDescription = stringResource(if (state.saved) R.string.place_unsave else R.string.place_save),
                onClick = onToggleSave,
                modifier = Modifier.padding(horizontal = AppSpacing.sm).testTag("place.save"),
            )

            PrimaryActionButton(
                text = stringResource(R.string.place_add_to_trip),
                onClick = onAddToTrip,
                testTag = "place.addToTrip",
                modifier = Modifier.padding(horizontal = AppSpacing.lg).padding(bottom = AppSpacing.xl),
            )
        }
        OverlayBackButton(
            contentDescription = stringResource(R.string.common_back),
            onClick = onBack,
            modifier = Modifier.statusBarsPadding().padding(AppSpacing.sm),
        )
        SnackbarHost(snackbar, modifier = Modifier.align(Alignment.BottomCenter).padding(AppSpacing.lg))
    }

    if (state.showTripSheet) {
        ModalBottomSheet(onDismissRequest = onDismissSheet) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Text(stringResource(R.string.place_add_to_trip_title), style = AppTypography.title)
                if (state.matchingTrips.isEmpty()) {
                    Text(stringResource(R.string.place_add_to_trip_empty), style = AppTypography.body)
                    PrimaryActionButton(
                        text = stringResource(R.string.place_start_trip),
                        onClick = onStartTrip,
                        testTag = "place.startTrip",
                    )
                } else {
                    state.matchingTrips.forEach { trip ->
                        TextButton(
                            onClick = { onSelectTrip(trip) },
                            modifier = Modifier.fillMaxWidth().testTag("place.trip.${trip.id}"), // geeknative-ignore
                        ) {
                            Text(trip.title, style = AppTypography.body)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroLabels(name: String, kind: String, modifier: Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
        Text(name, style = AppTypography.display, color = AppTheme.colors.onOverlay)
        Text(
            stringResource(PlaceKind.fromId(kind).label),
            style = AppTypography.label,
            color = AppTheme.colors.onOverlay,
        )
    }
}

@Preview
@Composable
private fun PlaceDetailsScreenPreview() {
    AppTheme(darkTheme = false) {
        PlaceDetailsContent(
            state = PlaceDetailsUiState(notFound = true),
            onBack = {},
            onToggleSave = {},
            onAddToTrip = {},
            onDismissSheet = {},
            onSelectTrip = {},
            onStartTrip = {},
            onAddedShown = {},
        )
    }
}
