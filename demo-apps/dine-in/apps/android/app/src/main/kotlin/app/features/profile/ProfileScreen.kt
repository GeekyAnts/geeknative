package app.features.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import app.R
import app.core.Timestamps
import app.core.designsystem.AppSerif
import app.core.designsystem.AppTheme
import app.core.designsystem.GlassSurface
import app.core.designsystem.Overline
import app.core.designsystem.ScreenHeader
import app.core.designsystem.SecondaryButton
import app.core.designsystem.tabBarClearance
import app.features.auth.Account
import app.features.auth.AuthRepository
import app.features.catalog.rememberFormatters
import app.features.reservation.ReservationsRepository
import app.features.saved.SavedRepository
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppIdentity
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import java.time.Clock
import java.time.LocalDateTime
import java.time.ZoneId
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ProfileUiState(
    val account: Account? = null,
    val initials: String = "",
    val memberSince: String? = null,
    val upcoming: Int = 0,
    val dined: Int = 0,
    val saved: Int = 0,
    val reminders: Boolean = true,
)

class ProfileViewModel(
    private val auth: AuthRepository,
    reservations: ReservationsRepository,
    saved: SavedRepository,
    private val preferences: PreferencesRepository,
    clock: Clock,
) : ViewModel() {
    val uiState: StateFlow<ProfileUiState> = combine(
        auth.account,
        reservations.reservations,
        saved.savedIds,
        preferences.preferences,
    ) { account, list, savedIds, prefs ->
        val now = LocalDateTime.now(clock)
        val joined = account?.createdAt?.let { Timestamps.parse(it)?.atZone(ZoneId.systemDefault())?.toLocalDate() }
        ProfileUiState(
            account = account,
            initials = MemberName.initials(account?.name.orEmpty()),
            memberSince = joined?.toString(),
            upcoming = list.count { it.isUpcoming(now) },
            dined = list.count { it.isPast(now) },
            saved = savedIds.size,
            reminders = prefs.reminders,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ProfileUiState())

    fun toggleReminders() {
        viewModelScope.launch {
            val current = preferences.load()
            preferences.save(current.copy(reminders = !current.reminders))
        }
    }

    fun signOut() {
        viewModelScope.launch { auth.signOut() }
    }
}

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onOpenSaved: () -> Unit,
    onOpenPreferences: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenHelp: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var confirming by remember { mutableStateOf(false) }
    val colors = AppTheme.colors
    val formatters = rememberFormatters()
    val memberSince = state.account?.createdAt?.let { text ->
        Timestamps.parse(text)?.atZone(ZoneId.systemDefault())?.toLocalDate()?.let(formatters::monthYear)
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding(),
        contentPadding = PaddingValues(
            start = AppSpacing.lg,
            end = AppSpacing.lg,
            top = AppSpacing.lg,
            bottom = tabBarClearance() + AppSpacing.lg,
        ),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
    ) {
        item { ScreenHeader(title = stringResource(R.string.profile_title)) }
        item {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppRadius.xl))
                    .background(colors.espresso)
                    .padding(AppSpacing.xl),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.lg), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(AppSize.avatarLarge).background(colors.onEspresso.copy(alpha = 0.1f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(state.initials, style = AppSerif.display, color = colors.accent)
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs)) {
                        Overline(stringResource(R.string.profile_membership), color = colors.accent)
                        Text(state.account?.name.orEmpty(), style = AppSerif.headline, color = colors.onEspresso, modifier = Modifier.testTag("profile.name"))
                        Text(state.account?.email.orEmpty(), style = AppTypography.caption, color = colors.onEspresso.copy(alpha = 0.8f), modifier = Modifier.testTag("profile.email"))
                        if (memberSince != null) {
                            Text(stringResource(R.string.profile_member_since, memberSince), style = AppTypography.caption, color = colors.onEspresso.copy(alpha = 0.7f))
                        }
                    }
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                StatTile(stringResource(R.string.profile_stats_upcoming), state.upcoming.toString(), Modifier.weight(1f).testTag("profile.stats.upcoming"))
                StatTile(stringResource(R.string.profile_stats_dined), state.dined.toString(), Modifier.weight(1f).testTag("profile.stats.dined"))
                StatTile(stringResource(R.string.profile_stats_saved), state.saved.toString(), Modifier.weight(1f).testTag("profile.stats.saved"))
            }
        }
        item {
            Column(Modifier.clip(RoundedCornerShape(AppRadius.lg)).background(colors.surface)) {
                ProfileRow(AppIcons.heart, stringResource(R.string.profile_saved_restaurants), onOpenSaved, "profile.savedRestaurants")
                ProfileRow(AppIcons.utensils, stringResource(R.string.profile_preferences), onOpenPreferences, "profile.preferences")
                ProfileRow(AppIcons.clock, stringResource(R.string.profile_history), onOpenHistory, "profile.history")
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(AppIcons.bell, contentDescription = null, tint = colors.accent, modifier = Modifier.size(AppIconSize.md))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.profile_notifications), style = AppTypography.subtitle, color = colors.onSurface)
                        Text(stringResource(R.string.profile_notifications_body), style = AppTypography.caption, color = colors.onSurfaceVariant)
                    }
                    Switch(checked = state.reminders, onCheckedChange = { viewModel.toggleReminders() }, modifier = Modifier.testTag("profile.reminders"))
                }
                ProfileRow(AppIcons.settings, stringResource(R.string.profile_settings), onOpenSettings, "profile.settings")
                ProfileRow(AppIcons.help, stringResource(R.string.profile_help), onOpenHelp, "profile.help")
            }
        }
        item {
            SecondaryButton(
                text = stringResource(R.string.profile_sign_out),
                onClick = { confirming = true },
                modifier = Modifier.fillMaxWidth().testTag("profile.signOut"),
                icon = AppIcons.signOut,
                color = colors.error,
            )
        }
        item {
            Text(
                AppIdentity.VERSION,
                style = AppTypography.caption,
                color = colors.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
    if (confirming) {
        AlertDialog(
            onDismissRequest = { confirming = false },
            title = { Text(stringResource(R.string.profile_sign_out_confirm_title)) },
            text = { Text(stringResource(R.string.profile_sign_out_confirm_body)) },
            confirmButton = {
                TextButton(onClick = { confirming = false; viewModel.signOut() }) {
                    Text(stringResource(R.string.profile_sign_out))
                }
            },
            dismissButton = {
                TextButton(onClick = { confirming = false }) { Text(stringResource(R.string.common_cancel)) }
            },
        )
    }
}

@Composable
private fun StatTile(label: String, value: String, modifier: Modifier = Modifier) {
    GlassSurface(shape = RoundedCornerShape(AppRadius.lg), modifier = modifier) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = AppSpacing.md),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(AppSpacing.xxs),
        ) {
            Text(value, style = AppSerif.headline, color = AppTheme.colors.onSurface)
            Text(label, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
        }
    }
}

@Composable
private fun ProfileRow(icon: ImageVector, label: String, onClick: () -> Unit, testId: String) {
    val colors = AppTheme.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md)
            .testTag(testId),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = colors.accent, modifier = Modifier.size(AppIconSize.md))
        Text(label, style = AppTypography.subtitle, color = colors.onSurface, modifier = Modifier.weight(1f))
        Icon(AppIcons.chevronRight, contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(AppIconSize.sm))
    }
}
