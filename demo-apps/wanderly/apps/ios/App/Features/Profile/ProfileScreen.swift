import SwiftUI

struct ProfileScreen: View {
    @Environment(AppContainer.self) private var container
    @FocusState private var nameFocused: Bool
    @FocusState private var emailFocused: Bool

    var body: some View {
        form(container.profileViewModel)
    }

    private func form(_ viewModel: ProfileViewModel) -> some View {
        @Bindable var viewModel = viewModel
        return Form {
            Section {
                HStack(spacing: AppSpacing.lg) {
                    Text(viewModel.initials)
                        .font(AppTypography.title)
                        .foregroundStyle(AppColors.onPrimary)
                        .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                        .background(AppColors.primary, in: Circle())
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(viewModel.displayedName)
                            .font(AppTypography.title)
                            .foregroundStyle(AppColors.onSurface)
                    }
                }
                .listRowBackground(AppColors.surface)

                TextField(Strings.profileDefaultName, text: $viewModel.name)
                    .focused($nameFocused)
                    .accessibilityIdentifier("profile.name")
                    .listRowBackground(AppColors.surface)
                    .onChange(of: nameFocused) { _, focused in
                        if !focused { viewModel.commitIdentity() }
                    }

                TextField(Strings.profileEmailPlaceholder, text: $viewModel.email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .focused($emailFocused)
                    .accessibilityIdentifier("profile.email")
                    .listRowBackground(AppColors.surface)
                    .onChange(of: emailFocused) { _, focused in
                        if !focused { viewModel.commitIdentity() }
                    }
            }

            Section(Strings.profilePreferences) {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.profileDefaultTravelers)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    TravelersStepper(
                        value: Binding(
                            get: { viewModel.travelers },
                            set: { viewModel.setTravelers($0) }
                        ),
                        identifier: "profile.travelers"
                    )
                }
                .listRowBackground(AppColors.surface)

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.profileDefaultBudget)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    BudgetBandRow(
                        selection: Binding(
                            get: { viewModel.budgetBand },
                            set: { viewModel.setBudget($0) }
                        ),
                        identifier: TestIDs.profileBudget
                    )
                }
                .listRowBackground(AppColors.surface)

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.profileInterests)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    CategoryChipRow(
                        selected: viewModel.interests,
                        identifier: TestIDs.profileInterest,
                        onTap: viewModel.toggleInterest
                    )
                }
                .listRowBackground(AppColors.surface)
            }

            Section {
                Button(Strings.profileOpenSettings, action: viewModel.openSettings)
                    .foregroundStyle(AppColors.primary)
                    .accessibilityIdentifier("profile.openSettings")
                    .listRowBackground(AppColors.surface)
            }

            Section(Strings.settingsAboutTitle) {
                Text(viewModel.versionText)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityIdentifier("profile.version")
                    .listRowBackground(AppColors.surface)
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .navigationTitle(Strings.profileTitle)
    }
}

#Preview {
    NavigationStack {
        ProfileScreen()
    }
    .environment(AppContainer.preview())
}
