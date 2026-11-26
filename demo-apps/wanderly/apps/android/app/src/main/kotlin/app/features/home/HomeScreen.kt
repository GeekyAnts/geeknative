package app.features.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.CatalogError
import app.core.designsystem.CategoryChipRow
import app.core.designsystem.OverlayPhotoCard
import app.core.designsystem.PhotoHero
import app.core.designsystem.PhotoMetaCard
import app.core.designsystem.RatingRow
import app.core.designsystem.SearchField
import app.core.designsystem.SectionHeader
import app.features.catalog.Destination
import app.features.catalog.Place
import app.features.catalog.TravelCategory
import app.generated.AppIdentity
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onSearch: (String) -> Unit,
    onCategory: (String) -> Unit,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    HomeContent(
        state = state,
        onQueryChange = viewModel::onQueryChange,
        onSearch = {
            onSearch(viewModel.trimmedQuery())
        },
        onCategory = onCategory,
        onOpenCity = onOpenCity,
        onOpenPlace = onOpenPlace,
        onRetry = viewModel::retry,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeContent(
    state: HomeUiState,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    onCategory: (String) -> Unit,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
    onRetry: () -> Unit,
) {
    val keyboard = LocalSoftwareKeyboardController.current
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(AppIdentity.NAME, modifier = Modifier.testTag("home.title"))
                },
            )
        },
    ) { padding ->
        if (state.catalogError) {
            CatalogError(
                title = stringResource(R.string.city_error_title),
                body = stringResource(R.string.city_error_body),
                onRetry = onRetry,
                modifier = Modifier.padding(padding),
            )
            return@Scaffold
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xl),
        ) {
            SearchField(
                value = state.query,
                onValueChange = onQueryChange,
                placeholder = stringResource(R.string.home_search_placeholder),
                testTag = "home.search",
                modifier = Modifier.padding(horizontal = AppSpacing.lg),
                onSearch = {
                    keyboard?.hide()
                    onSearch()
                },
            )

            state.featured?.let { featured ->
                FeaturedDestination(
                    destination = featured,
                    fallbackUrl = state.fallbackImageUrl,
                    onClick = { onOpenCity(featured.id) },
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(stringResource(R.string.home_trending_title))
                Row(
                    modifier = Modifier
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = AppSpacing.lg),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    state.trending.forEach { destination ->
                        OverlayPhotoCard(
                            imageUrl = destination.imageUrl,
                            fallbackUrl = state.fallbackImageUrl,
                            contentDescription = destination.name,
                            modifier = Modifier
                                .width(AppSize.cardImage)
                                .testTag("home.trending.${destination.id}"), // geeknative-ignore
                            height = AppSize.cardImage,
                            onClick = { onOpenCity(destination.id) },
                        ) {
                            Text(
                                destination.name,
                                style = AppTypography.title,
                                color = AppTheme.colors.onOverlay,
                            )
                        }
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(stringResource(R.string.home_categories_title))
                CategoryChipRow(
                    selectedIds = emptySet(),
                    onSelect = { category: TravelCategory -> onCategory(category.id) },
                    testTagPrefix = "home.category",
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(stringResource(R.string.home_popular_title))
                Column(
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    state.popular.forEach { place ->
                        PopularPlaceCard(
                            place = place,
                            destinationName = state.destinationNames[place.destinationId].orEmpty(),
                            fallbackUrl = state.fallbackImageUrl,
                            onClick = { onOpenPlace(place.id) },
                        )
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                SectionHeader(stringResource(R.string.home_inspiration_title))
                Column(
                    modifier = Modifier.padding(horizontal = AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                ) {
                    state.inspiration.forEach { destination ->
                        InspirationCard(
                            destination = destination,
                            fallbackUrl = state.fallbackImageUrl,
                            onClick = { onOpenCity(destination.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FeaturedDestination(destination: Destination, fallbackUrl: String, onClick: () -> Unit) {
    Box(
        Modifier
            .padding(horizontal = AppSpacing.lg)
            .testTag("home.featured")
            .clickable(onClick = onClick),
    ) {
        PhotoHero(
            imageUrl = destination.imageUrl,
            fallbackUrl = fallbackUrl,
            contentDescription = destination.name,
            height = AppSize.featured,
            modifier = Modifier.fillMaxWidth(),
            overlay = {
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(AppSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                ) {
                    Text(
                        stringResource(R.string.home_featured_label),
                        style = AppTypography.label,
                        color = AppTheme.colors.onOverlay,
                    )
                    Text(destination.name, style = AppTypography.display, color = AppTheme.colors.onOverlay)
                    Text(destination.country, style = AppTypography.label, color = AppTheme.colors.onOverlay)
                }
            },
        )
    }
}

@Composable
private fun PopularPlaceCard(place: Place, destinationName: String, fallbackUrl: String, onClick: () -> Unit) {
    PhotoMetaCard(
        imageUrl = place.imageUrl,
        fallbackUrl = fallbackUrl,
        contentDescription = place.name,
        modifier = Modifier.testTag("home.popular.${place.id}"), // geeknative-ignore
        onClick = onClick,
    ) {
        Text(place.name, style = AppTypography.title)
        Text(destinationName, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
        RatingRow(stringResource(R.string.home_rating_label, place.rating.toString()))
    }
}

@Composable
private fun InspirationCard(destination: Destination, fallbackUrl: String, onClick: () -> Unit) {
    PhotoMetaCard(
        imageUrl = destination.imageUrl,
        fallbackUrl = fallbackUrl,
        contentDescription = destination.name,
        modifier = Modifier.testTag("home.inspiration.${destination.id}"), // geeknative-ignore
        onClick = onClick,
    ) {
        Text(destination.name, style = AppTypography.title)
        Text(destination.tagline, style = AppTypography.label, color = AppTheme.colors.primary)
        Text(destination.description, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant, maxLines = 3)
    }
}

@Preview
@Composable
private fun HomeScreenPreview() {
    AppTheme(darkTheme = false) {
        HomeContent(
            state = HomeUiState(),
            onQueryChange = {},
            onSearch = {},
            onCategory = {},
            onOpenCity = {},
            onOpenPlace = {},
            onRetry = {},
        )
    }
}
