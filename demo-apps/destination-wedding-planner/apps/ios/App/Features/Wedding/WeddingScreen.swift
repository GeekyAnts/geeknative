import SwiftUI

struct WeddingScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(AppNavigation.self) private var navigation
    @State private var viewModel = WeddingViewModel(repository: InMemoryWeddingRepository())
    @State private var didLoad = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                Text(Strings.weddingBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                countdown
                placeCards
                editors
                timeline
                saved
                Button(Strings.weddingPackagesCta) {
                    navigation.push(.packages)
                }
                .buttonStyle(.primary)
                .accessibilityIdentifier("wedding.packagesCta")
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.weddingTitle)
        .onAppear {
            if !didLoad {
                didLoad = true
                viewModel = WeddingViewModel(repository: container.weddingRepository)
            } else {
                viewModel.refresh()
            }
        }
        .onChange(of: navigation.selectedTab) { _, tab in
            if tab == .wedding {
                viewModel.refresh()
            }
        }
    }

    private var countdown: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                if viewModel.plan.date.isEmpty {
                    Text(Strings.weddingNoDateTitle)
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.onSurface)
                    Text(Strings.weddingNoDateBody)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                } else {
                    Text(viewModel.remaining == 0 ? Strings.weddingCountdownToday : Strings.weddingCountdown(count: viewModel.remaining))
                        .font(AppTypography.hero)
                        .foregroundStyle(AppColors.onSurface)
                        .accessibilityIdentifier("wedding.countdown")
                }
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(Strings.weddingDate)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    HStack(spacing: AppSpacing.sm) {
                        Image(AppIcon.calendar)
                            .foregroundStyle(AppColors.primary)
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        AppDateField(
                            title: Strings.weddingDate,
                            date: Binding(
                                get: { viewModel.date },
                                set: { viewModel.setDate($0) }
                            ),
                            hasDate: Binding(
                                get: { !viewModel.plan.date.isEmpty },
                                set: { if $0 { viewModel.setDate(viewModel.date) } }
                            ),
                            testID: "wedding.date"
                        )
                    }
                    .padding(.horizontal, AppSpacing.md)
                    .frame(minHeight: AppSize.touchTarget)
                    .background(AppColors.background, in: .rect(cornerRadius: AppRadius.sm))
                    .overlay {
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .stroke(AppColors.outline)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var placeCards: some View {
        VStack(spacing: AppSpacing.md) {
            GlassPanel {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.weddingDestination)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    Text(viewModel.destination?.name ?? Strings.weddingNoDestination)
                        .font(AppTypography.title)
                        .foregroundStyle(AppColors.onSurface)
                        .accessibilityIdentifier("wedding.destination")
                    if let destination = viewModel.destination {
                        CatalogPhoto(urlString: destination.imageUrl)
                            .frame(height: 140)
                            .frame(maxWidth: .infinity)
                            .clipShape(.rect(cornerRadius: AppRadius.lg))
                    } else {
                        Button(Strings.navDestinations) {
                            navigation.open(.destinations)
                        }
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.primary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            GlassPanel {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.weddingVenue)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    Text(viewModel.venue?.name ?? Strings.weddingNoVenue)
                        .font(AppTypography.title)
                        .foregroundStyle(AppColors.onSurface)
                        .accessibilityIdentifier("wedding.venue")
                    if let venue = viewModel.venue {
                        CatalogPhoto(urlString: venue.imageUrl)
                            .frame(height: 140)
                            .frame(maxWidth: .infinity)
                            .clipShape(.rect(cornerRadius: AppRadius.lg))
                    } else {
                        Button(Strings.navVenues) {
                            navigation.open(.venues)
                        }
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.primary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var editors: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            field(Strings.weddingGuests, text: $viewModel.guestsText, identifier: "wedding.guests", onCommit: viewModel.setGuests)
            field(Strings.weddingBudget, text: $viewModel.budgetText, identifier: "wedding.budget", onCommit: viewModel.setBudget)
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(Strings.weddingStatusLabel)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(viewModel.plan.bookingStatus.label)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                    .accessibilityIdentifier("wedding.status")
            }
        }
    }

    private var timeline: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.weddingTimeline)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(Strings.weddingProgress(completed: viewModel.plan.completedTaskIds.count, total: TaskId.allCases.count))
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .accessibilityIdentifier("wedding.progress")
            ForEach(TaskId.allCases) { task in
                let done = viewModel.plan.completedTaskIds.contains(task.rawValue)
                Button {
                    viewModel.toggleTask(task)
                } label: {
                    HStack(spacing: AppSpacing.md) {
                        Image(done ? AppIcon.check : AppIcon.plus)
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                            .foregroundStyle(done ? AppColors.primary : AppColors.onSurfaceVariant)
                        Text(task.label)
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurface)
                        Spacer()
                    }
                    .padding(.horizontal, AppSpacing.lg)
                    .frame(minHeight: AppSize.touchTarget)
                    .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("wedding.task.\(task.rawValue)")
            }
        }
    }

    private var saved: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.weddingSaved)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            if viewModel.savedDestinations.isEmpty && viewModel.savedVenues.isEmpty {
                Text(Strings.weddingSavedEmpty)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            } else {
                ForEach(viewModel.savedDestinations) { destination in
                    NavigationLink(value: Route.destination(destination.id)) {
                        savedCard(name: destination.name, imageUrl: destination.imageUrl)
                    }
                    .buttonStyle(.plain)
                }
                ForEach(viewModel.savedVenues) { venue in
                    NavigationLink(value: Route.venue(venue.id)) {
                        savedCard(name: venue.name, imageUrl: venue.imageUrl)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .testIdentifier(testId: "wedding.saved")
    }

    private func savedCard(name: String, imageUrl: String) -> some View {
        HStack(spacing: AppSpacing.md) {
            CatalogPhoto(urlString: imageUrl)
                .frame(width: 96, height: 72)
                .clipShape(.rect(cornerRadius: AppRadius.md))
            Text(name)
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onSurface)
            Spacer()
        }
        .padding(AppSpacing.md)
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
        .shadow(AppElevation.low)
    }

    private func field(_ title: String, text: Binding<String>, identifier: String, onCommit: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            AppTextField(prompt: title, text: text, keyboard: .numberPad)
                .padding(.horizontal, AppSpacing.md)
                .frame(minHeight: AppSize.touchTarget)
                .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .stroke(AppColors.outline)
                }
                .accessibilityIdentifier(identifier)
                .onChange(of: text.wrappedValue) { _, _ in
                    onCommit()
                }
        }
    }
}

#Preview {
    NavigationStack {
        WeddingScreen()
    }
    .environment(AppContainer.preview())
    .environment(AppNavigation())
}
