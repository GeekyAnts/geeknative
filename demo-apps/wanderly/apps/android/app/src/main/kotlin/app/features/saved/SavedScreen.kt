package app.features.saved

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.PhotoMetaCard
import app.core.designsystem.SaveHeartButton
import app.core.designsystem.SectionHeader
import app.features.catalog.PlaceKind
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun SavedScreen(
    viewModel: SavedViewModel,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    SavedContent(
        state = state,
        onOpenCity = onOpenCity,
        onOpenPlace = onOpenPlace,
        onUnsave = viewModel::unsave,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SavedContent(
    state: SavedUiState,
    onOpenCity: (String) -> Unit,
    onOpenPlace: (String) -> Unit,
    onUnsave: (String) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.saved_title), modifier = Modifier.testTag("saved.title")) },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            if (state.empty) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(AppSpacing.lg)
                        .testTag("saved.empty"),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    Text(stringResource(R.string.saved_empty_title), style = AppTypography.title)
                    Text(
                        stringResource(R.string.saved_empty_body),
                        style = AppTypography.body,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                }
            } else {
                if (state.destinations.isNotEmpty()) {
                    SectionHeader(stringResource(R.string.saved_destinations))
                    Column(
                        modifier = Modifier.padding(horizontal = AppSpacing.lg),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    ) {
                        state.destinations.forEach { item ->
                            Box {
                                PhotoMetaCard(
                                    imageUrl = item.destination.imageUrl,
                                    fallbackUrl = state.fallbackImageUrl,
                                    contentDescription = item.destination.name,
                                    modifier = Modifier.testTag("saved.destination.${item.destination.id}"), // geeknative-ignore
                                    onClick = { onOpenCity(item.destination.id) },
                                ) {
                                    Text(item.destination.name, style = AppTypography.title)
                                    Text(
                                        item.destination.country,
                                        style = AppTypography.caption,
                                        color = AppTheme.colors.onSurfaceVariant,
                                    )
                                }
                                SaveHeartButton(
                                    saved = true,
                                    contentDescription = stringResource(R.string.city_unsave),
                                    onClick = { onUnsave(item.destination.id) },
                                    modifier = Modifier.align(Alignment.TopEnd).testTag("saved.unsave.${item.destination.id}"), // geeknative-ignore
                                )
                            }
                        }
                    }
                }
                if (state.places.isNotEmpty()) {
                    SectionHeader(stringResource(R.string.saved_places))
                    Column(
                        modifier = Modifier.padding(horizontal = AppSpacing.lg),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    ) {
                        state.places.forEach { item ->
                            Box {
                                PhotoMetaCard(
                                    imageUrl = item.place.imageUrl,
                                    fallbackUrl = state.fallbackImageUrl,
                                    contentDescription = item.place.name,
                                    modifier = Modifier.testTag("saved.place.${item.place.id}"), // geeknative-ignore
                                    onClick = { onOpenPlace(item.place.id) },
                                ) {
                                    Text(item.place.name, style = AppTypography.title)
                                    Text(
                                        stringResource(PlaceKind.fromId(item.place.kind).label),
                                        style = AppTypography.label,
                                        color = AppTheme.colors.primary,
                                    )
                                    Text(
                                        item.destinationName,
                                        style = AppTypography.caption,
                                        color = AppTheme.colors.onSurfaceVariant,
                                    )
                                }
                                SaveHeartButton(
                                    saved = true,
                                    contentDescription = stringResource(R.string.place_unsave),
                                    onClick = { onUnsave(item.place.id) },
                                    modifier = Modifier.align(Alignment.TopEnd).testTag("saved.unsave.${item.place.id}"), // geeknative-ignore
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Preview
@Composable
private fun SavedScreenPreview() {
    AppTheme(darkTheme = false) {
        SavedContent(state = SavedUiState(), onOpenCity = {}, onOpenPlace = {}, onUnsave = {})
    }
}
