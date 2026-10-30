import SwiftUI

struct SettingsScreen: View {
    @State private var viewModel: SettingsViewModel

    init(viewModel: SettingsViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Form {
            Section(Strings.settingsAppearanceTitle) {
                Picker(Strings.settingsAppearanceTitle, selection: Binding(
                    get: { viewModel.appearance },
                    set: { viewModel.selectAppearance($0) }
                )) {
                    ForEach(viewModel.appearanceOptions) { option in
                        Text(option.label).tag(option)
                    }
                }
                .pickerStyle(.inline)
                .labelsHidden()
                .accessibilityIdentifier("settings.appearance")
            }

            Section(Strings.settingsAboutTitle) {
                Text(viewModel.versionText)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityIdentifier("settings.version")
            }
        }
        .font(AppTypography.body)
        .navigationTitle(Strings.settingsTitle)
    }
}

#Preview {
    NavigationStack {
        SettingsScreen(viewModel: SettingsViewModel(repository: InMemorySettingsRepository()))
    }
}
