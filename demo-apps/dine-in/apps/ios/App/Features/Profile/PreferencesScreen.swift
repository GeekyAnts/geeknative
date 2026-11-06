import Observation
import SwiftUI

/// Dining preferences; every change saves immediately.
@Observable
final class PreferencesViewModel {
    @ObservationIgnored private let repository: any PreferencesRepository

    init(repository: any PreferencesRepository) {
        self.repository = repository
    }

    var preferences: DiningPreferences { repository.preferences }

    func toggle(_ cuisine: CuisineId) {
        update { preferences in
            if let index = preferences.cuisines.firstIndex(of: cuisine) {
                preferences.cuisines.remove(at: index)
            } else {
                preferences.cuisines.append(cuisine)
            }
        }
    }

    func toggle(_ dietary: Dietary) {
        update { preferences in
            if let index = preferences.dietary.firstIndex(of: dietary) {
                preferences.dietary.remove(at: index)
            } else {
                preferences.dietary.append(dietary)
            }
        }
    }

    func select(_ seating: Seating) {
        update { $0.seating = seating }
    }

    var canDecrease: Bool { preferences.partySize > DiningPreferences.partySizeRange.lowerBound }
    var canIncrease: Bool { preferences.partySize < DiningPreferences.partySizeRange.upperBound }

    func decreaseParty() {
        guard canDecrease else { return }
        update { $0.partySize -= 1 }
    }

    func increaseParty() {
        guard canIncrease else { return }
        update { $0.partySize += 1 }
    }

    private func update(_ change: (inout DiningPreferences) -> Void) {
        var preferences = repository.preferences
        change(&preferences)
        repository.save(preferences)
    }
}

struct PreferencesScreen: View {
    @State private var viewModel: PreferencesViewModel

    init(viewModel: PreferencesViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        let preferences = viewModel.preferences
        PushedScaffold(title: Strings.preferencesTitle) {
            ScreenHeader(title: Strings.preferencesTitle, subtitle: Strings.preferencesSubtitle)
            panel(Strings.preferencesCuisines) {
                FlowLayout(spacing: AppSpacing.sm) {
                    ForEach(CuisineId.allCases) { cuisine in
                        Chip(label: cuisine.label, isSelected: preferences.cuisines.contains(cuisine)) {
                            viewModel.toggle(cuisine)
                        }
                        .accessibilityIdentifier("preferences.cuisine.\(cuisine.rawValue)")
                    }
                }
            }
            .reveal(0)
            panel(Strings.preferencesDietary) {
                FlowLayout(spacing: AppSpacing.sm) {
                    ForEach(Dietary.allCases) { dietary in
                        Chip(label: dietary.label, isSelected: preferences.dietary.contains(dietary)) {
                            viewModel.toggle(dietary)
                        }
                        .accessibilityIdentifier("preferences.dietary.\(dietary.rawValue)")
                    }
                }
            }
            .reveal(1)
            panel(Strings.preferencesSeating) {
                FlowLayout(spacing: AppSpacing.sm) {
                    ForEach(Seating.allCases) { seating in
                        Chip(label: seating.label, icon: seating.icon, isSelected: preferences.seating == seating) {
                            viewModel.select(seating)
                        }
                        .accessibilityIdentifier("preferences.seating.\(seating.rawValue)")
                    }
                }
            }
            .reveal(2)
            panel(Strings.preferencesPartySize) {
                HStack {
                    GlassIconButton(icon: AppIcon.minus, label: Strings.reserveRemoveGuest, isEnabled: viewModel.canDecrease) {
                        viewModel.decreaseParty()
                    }
                    .accessibilityIdentifier("preferences.partySize.decrease")
                    Spacer()
                    Text(Strings.reserveGuestCount(count: preferences.partySize))
                        .font(AppSerif.title)
                        .foregroundStyle(AppColors.onSurface)
                        .contentTransition(.numericText())
                        .accessibilityIdentifier("preferences.partySize.count")
                    Spacer()
                    GlassIconButton(icon: AppIcon.plus, label: Strings.reserveAddGuest, isEnabled: viewModel.canIncrease) {
                        viewModel.increaseParty()
                    }
                    .accessibilityIdentifier("preferences.partySize.increase")
                }
            }
            .reveal(3)
        }
        .sensoryFeedback(.selection, trigger: preferences)
    }

    private func panel(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Overline(title, color: AppColors.onSurfaceVariant)
            content()
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassSurface(cornerRadius: AppRadius.lg)
    }
}

#Preview {
    NavigationStack {
        PreferencesScreen(viewModel: PreferencesViewModel(repository: InMemoryPreferencesRepository()))
            .toolbar(.hidden, for: .navigationBar)
    }
}
