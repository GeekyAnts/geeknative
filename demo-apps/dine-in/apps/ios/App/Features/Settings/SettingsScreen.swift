import SwiftUI

struct SettingsScreen: View {
    @State private var viewModel: SettingsViewModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: SettingsViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        PushedScaffold(title: Strings.settingsTitle) {
            ScreenHeader(title: Strings.settingsTitle)
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Overline(Strings.settingsAppearanceTitle, color: AppColors.onSurfaceVariant)
                RowsCard {
                    ForEach(Array(viewModel.appearanceOptions.enumerated()), id: \.element) { index, option in
                        if index > 0 { RowDivider() }
                        appearanceRow(option)
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("settings.appearance")
            }
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Overline(Strings.settingsAboutTitle, color: AppColors.onSurfaceVariant)
                RowsCard {
                    Text(viewModel.versionText)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget, alignment: .leading)
                        .padding(.horizontal, AppSpacing.lg)
                        .accessibilityIdentifier("settings.version")
                }
            }
        }
        .sensoryFeedback(.selection, trigger: viewModel.appearance)
    }

    private func appearanceRow(_ option: Appearance) -> some View {
        let selected = option == viewModel.appearance
        return Button {
            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) {
                viewModel.selectAppearance(option)
            }
        } label: {
            HStack {
                Text(option.label)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                Spacer()
                if selected {
                    Image(AppIcon.check)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.espresso)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .frame(minHeight: AppSize.touchTarget + AppSpacing.sm)
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

#Preview {
    NavigationStack {
        SettingsScreen(viewModel: SettingsViewModel(repository: InMemorySettingsRepository()))
            .toolbar(.hidden, for: .navigationBar)
    }
}
