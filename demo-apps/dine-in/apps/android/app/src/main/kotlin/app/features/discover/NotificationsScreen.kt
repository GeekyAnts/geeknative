package app.features.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
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
import app.core.designsystem.EmptyState
import app.core.designsystem.PushedScreen
import app.core.designsystem.ScreenHeader
import app.core.designsystem.appear
import app.core.designsystem.pressScale
import app.features.catalog.rememberFormatters
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun NotificationsScreen(viewModel: NotificationsViewModel, onBack: () -> Unit, onOpenReservation: (String) -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    NotificationsContent(state, onBack, onOpenReservation)
}

@Composable
fun NotificationsContent(state: NotificationsUiState, onBack: () -> Unit, onOpenReservation: (String) -> Unit) {
    val colors = AppTheme.colors
    val formatters = rememberFormatters()
    val title = stringResource(R.string.notifications_title)
    PushedScreen(onBack = onBack, title = title) {
        item { ScreenHeader(title = title, modifier = Modifier.appear()) }
        if (!state.loading && state.reminders.isEmpty()) {
            item {
                EmptyState(
                    icon = AppIcons.bell,
                    title = stringResource(R.string.notifications_empty_title),
                    body = stringResource(R.string.notifications_empty_body),
                    modifier = Modifier.testTag("notifications.empty"),
                )
            }
        }
        items(state.reminders, key = { it.id }) { reservation ->
            val name = state.restaurants[reservation.restaurantId]?.name.orEmpty()
            val interaction = remember { MutableInteractionSource() }
            Row(
                Modifier
                    .appear(1)
                    .fillMaxWidth()
                    .pressScale(interaction)
                    .clip(RoundedCornerShape(AppRadius.lg))
                    .background(colors.surface)
                    .clickable(interactionSource = interaction, indication = ripple()) { onOpenReservation(reservation.id) }
                    .padding(AppSpacing.lg)
                    .testTag("notifications.item.${reservation.id}"),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.size(AppSize.touchTarget).background(colors.accent, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(AppIcons.bell, contentDescription = null, tint = colors.onAccent, modifier = Modifier.size(AppIconSize.md))
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs)) {
                    Text(
                        stringResource(R.string.notifications_reminder, name, formatters.dateShort(reservation.date), formatters.time(reservation.time)),
                        style = AppTypography.body,
                        color = colors.onSurface,
                    )
                    Text(reservation.confirmationCode, style = AppTypography.caption, color = colors.onSurfaceVariant)
                }
            }
        }
    }
}

@Preview
@Composable
private fun NotificationsPreview() {
    AppTheme(darkTheme = false) { NotificationsContent(NotificationsUiState(loading = false), {}, {}) }
}
