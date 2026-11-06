import SwiftUI

/// The member's corner: member card, stats, rows and sign out.
struct ProfileScreen: View {
    @State private var viewModel: ProfileViewModel
    @State private var confirmingSignOut = false
    @Environment(AppContainer.self) private var container
    @Environment(AppRouter.self) private var router

    init(viewModel: ProfileViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                ScreenHeader(title: Strings.profileTitle)
                if case .failed = viewModel.state {
                    ErrorState { Task { await viewModel.retry() } }
                } else {
                    memberCard.reveal(0)
                    statsRow.reveal(1)
                    rows.reveal(2)
                    SecondaryButton(title: Strings.profileSignOut, icon: AppIcon.signOut, tint: AppColors.error) {
                        confirmingSignOut = true
                    }
                    .accessibilityIdentifier("profile.signOut")
                    .reveal(3)
                    Text(viewModel.versionText)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.top, AppSpacing.sm)
            .tabBarClearance()
        }
        .scrollIndicators(.hidden)
        .background(AppColors.background.ignoresSafeArea())
        .task { await viewModel.load() }
        .confirmationDialog(Strings.profileSignOutConfirmTitle, isPresented: $confirmingSignOut, titleVisibility: .visible) {
            Button(Strings.profileSignOut, role: .destructive) {
                container.signOut()
            }
            Button(Strings.commonCancel, role: .cancel) {}
        } message: {
            Text(Strings.profileSignOutConfirmBody)
        }
    }

    private var memberCard: some View {
        HStack(alignment: .center, spacing: AppSpacing.lg) {
            Text(viewModel.initials)
                .font(AppSerif.display)
                .foregroundStyle(AppColors.onEspresso)
                .frame(width: AppSize.avatarLarge, height: AppSize.avatarLarge)
                .background(AppColors.onEspresso.opacity(0.08), in: .circle)
                .overlay(Circle().strokeBorder(AppColors.accent, lineWidth: AppSize.hairline * 2))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Overline(Strings.profileMembership)
                Text(viewModel.name)
                    .font(AppSerif.headline)
                    .foregroundStyle(AppColors.onEspresso)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                    .accessibilityIdentifier("profile.name")
                Text(viewModel.email)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onEspresso.opacity(0.8))
                    .lineLimit(1)
                    .accessibilityIdentifier("profile.email")
                Text(viewModel.memberSince)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.accent)
            }
            Spacer(minLength: 0)
        }
        .padding(AppSpacing.xl)
        .background {
            ZStack {
                AppColors.espresso
                LinearGradient(
                    colors: [AppColors.accent.opacity(0), AppColors.accent.opacity(0.16), AppColors.accent.opacity(0)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
        .clipShape(.rect(cornerRadius: AppRadius.xl, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: AppRadius.xl - AppSpacing.sm, style: .continuous)
                .strokeBorder(AppColors.accent.opacity(0.6), lineWidth: AppSize.hairline)
                .padding(AppSpacing.sm)
                .allowsHitTesting(false)
        }
        .shadow(AppElevation.low)
    }

    private var statsRow: some View {
        HStack(spacing: AppSpacing.md) {
            statTile(Strings.profileStatsUpcoming, value: viewModel.stats?.upcoming, testID: "profile.stats.upcoming")
            statTile(Strings.profileStatsDined, value: viewModel.stats?.dined, testID: "profile.stats.dined")
            statTile(Strings.profileStatsSaved, value: viewModel.stats?.saved, testID: "profile.stats.saved")
        }
    }

    private func statTile(_ label: String, value: Int?, testID: String) -> some View {
        VStack(spacing: AppSpacing.xxs) {
            if let value {
                Text(verbatim: String(value))
                    .font(AppSerif.headline)
                    .foregroundStyle(AppColors.onSurface)
                    .contentTransition(.numericText())
            } else {
                Skeleton(cornerRadius: AppRadius.sm)
                    .frame(width: AppSize.touchTarget, height: AppSize.chip)
            }
            Text(label)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppSpacing.lg)
        .padding(.horizontal, AppSpacing.xs)
        .glassSurface(cornerRadius: AppRadius.lg)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier(testID)
    }

    private var rows: some View {
        RowsCard {
            ProfileRow(icon: AppIcon.heart, title: Strings.profileSavedRestaurants) { router.switchTab(.saved) }
                .accessibilityIdentifier("profile.savedRestaurants")
            RowDivider()
            ProfileRow(icon: AppIcon.utensils, title: Strings.profilePreferences) { router.push(.preferences) }
                .accessibilityIdentifier("profile.preferences")
            RowDivider()
            ProfileRow(icon: AppIcon.clock, title: Strings.profileHistory) { router.openReservations(.past) }
                .accessibilityIdentifier("profile.history")
            RowDivider()
            remindersRow
            RowDivider()
            ProfileRow(icon: AppIcon.settings, title: Strings.profileSettings) { router.push(.settings) }
                .accessibilityIdentifier("profile.settings")
            RowDivider()
            ProfileRow(icon: AppIcon.help, title: Strings.profileHelp) { router.push(.help) }
                .accessibilityIdentifier("profile.help")
        }
    }

    private var remindersRow: some View {
        Toggle(isOn: Binding(get: { viewModel.reminders }, set: { viewModel.setReminders($0) })) {
            HStack(spacing: AppSpacing.md) {
                RowIcon(icon: AppIcon.bell)
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text(Strings.profileNotifications)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurface)
                    Text(Strings.profileNotificationsBody)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                }
            }
        }
        .tint(AppColors.espresso)
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.sm)
        .frame(minHeight: AppSize.touchTarget + AppSpacing.md)
        .accessibilityIdentifier("profile.reminders")
        .sensoryFeedback(.selection, trigger: viewModel.reminders)
    }
}

/// The leading icon of a row, in an `accent` circle.
struct RowIcon: View {
    let icon: ImageResource

    var body: some View {
        Image(icon)
            .renderingMode(.template).resizable().scaledToFit()
            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
            .foregroundStyle(AppColors.onAccent)
            .frame(width: AppSize.avatar - AppSpacing.sm, height: AppSize.avatar - AppSpacing.sm)
            .background(AppColors.accent, in: .circle)
            .accessibilityHidden(true)
    }
}

/// A navigation row: icon, title (and optional detail) and a trailing chevron.
struct ProfileRow: View {
    let icon: ImageResource
    let title: String
    var detail: String?
    var trailingIcon: ImageResource = AppIcon.chevronRight
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.md) {
                RowIcon(icon: icon)
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text(title)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurface)
                    if let detail {
                        Text(detail)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                    }
                }
                Spacer(minLength: AppSpacing.sm)
                Image(trailingIcon)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.vertical, AppSpacing.sm)
            .frame(minHeight: AppSize.touchTarget + AppSpacing.md)
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
    }
}

#Preview {
    let session = MemberSession.preview()
    ProfileScreen(viewModel: ProfileViewModel(session: session))
        .environment(AppContainer.preview(signedIn: true))
        .environment(session)
        .environment(session.router)
}
