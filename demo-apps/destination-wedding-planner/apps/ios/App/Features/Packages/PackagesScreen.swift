import SwiftUI

struct PackagesScreen: View {
    @Environment(AppContainer.self) private var container
    @State private var viewModel = PackagesViewModel(repository: InMemoryWeddingRepository())
    @State private var didLoad = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                Text(Strings.packagesBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                list
                composer
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.packagesTitle)
        .onAppear {
            guard !didLoad else { return }
            didLoad = true
            viewModel = PackagesViewModel(repository: container.weddingRepository)
        }
    }

    private var list: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            ForEach(WeddingCatalog.packages) { item in
                Button {
                    viewModel.selectedId = item.id
                } label: {
                    packageCard(item, selected: viewModel.selectedId == item.id)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("packages.card.\(item.id)")
            }
        }
        .testIdentifier(testId: "packages.list")
    }

    private func packageCard(_ item: WeddingPackage, selected: Bool) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            CatalogPhoto(urlString: item.imageUrl)
                .frame(height: 160)
                .frame(maxWidth: .infinity)
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(item.name)
                    .font(AppTypography.headline)
                    .foregroundStyle(AppColors.onSurface)
                Text(item.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(CatalogFormat.amount(item.basePrice))
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.primary)
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.xl))
        .overlay {
            RoundedRectangle(cornerRadius: AppRadius.xl)
                .stroke(selected ? AppColors.primary : AppColors.outline, lineWidth: selected ? 2 : 1)
        }
        .shadow(AppElevation.high)
    }

    private var composer: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(Strings.packagesGuests)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    Stepper(value: $viewModel.guests, in: 2...500) {
                        Text(String(viewModel.guests))
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onBackground)
                    }
                    .frame(minHeight: AppSize.touchTarget)
                    .accessibilityIdentifier("packages.guests")
                }
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.packagesAddons)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    ForEach(WeddingCatalog.experiences) { experience in
                        Toggle(isOn: addonBinding(experience.id)) {
                            Text(experience.name)
                                .font(AppTypography.body)
                                .foregroundStyle(AppColors.onSurface)
                        }
                        .frame(minHeight: AppSize.touchTarget)
                    }
                }
                breakdown
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var breakdown: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text(Strings.packagesBreakdown)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            line(Strings.packagesLineVenue, viewModel.breakdown.venue)
            line(Strings.packagesLineAccommodation, viewModel.breakdown.accommodation)
            line(Strings.packagesLineCatering, viewModel.breakdown.catering)
            line(Strings.packagesLineDecoration, viewModel.breakdown.decoration)
            line(Strings.packagesLinePhotography, viewModel.breakdown.photography)
            line(Strings.packagesLineExperiences, viewModel.breakdown.experiences)
            Text(Strings.packagesTotal + " " + CatalogFormat.amount(viewModel.breakdown.total))
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onBackground)
                .accessibilityIdentifier("packages.total")
            Button(viewModel.isSelected ? Strings.packagesSelected : Strings.packagesSelectCta) {
                viewModel.selectPackage()
            }
            .buttonStyle(.primary)
            .frame(maxWidth: .infinity)
            .accessibilityIdentifier("packages.selectCta")
        }
        .testIdentifier(testId: "packages.breakdown")
    }

    private func line(_ title: String, _ amount: Int) -> some View {
        HStack {
            Text(title)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
            Spacer()
            Text(CatalogFormat.amount(amount))
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
        }
    }

    private func addonBinding(_ id: String) -> Binding<Bool> {
        Binding(
            get: { viewModel.addons.contains(id) },
            set: { _ in viewModel.addons = withToggledId(viewModel.addons, id) }
        )
    }
}

#Preview {
    NavigationStack {
        PackagesScreen()
    }
    .environment(AppContainer.preview())
}
