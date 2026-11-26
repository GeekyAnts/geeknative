import SwiftUI

struct MyTripsScreen: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        content(container.myTripsViewModel)
            .background(AppColors.background)
            .navigationTitle(Strings.tripsTitle)
            .onAppear { container.myTripsViewModel.refresh() }
    }

    private func content(_ viewModel: MyTripsViewModel) -> some View {
        @Bindable var viewModel = viewModel
        return VStack(spacing: AppSpacing.lg) {
            segmentControl(viewModel)
                .padding(.horizontal, AppSpacing.lg)
            if viewModel.isEmpty {
                emptyState(viewModel)
            } else {
                List {
                    ForEach(viewModel.trips) { trip in
                        tripCard(trip, viewModel: viewModel)
                            .listRowInsets(EdgeInsets(
                                top: AppSpacing.sm,
                                leading: AppSpacing.lg,
                                bottom: AppSpacing.sm,
                                trailing: AppSpacing.lg
                            ))
                            .listRowSeparator(.hidden)
                            .listRowBackground(AppColors.background)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(Strings.commonDelete, role: .destructive) {
                                    viewModel.confirmDelete(trip)
                                }
                            }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .confirmationDialog(
            Strings.tripsDeleteTitle,
            isPresented: Binding(
                get: { viewModel.pendingDelete != nil },
                set: { if !$0 { viewModel.cancelDelete() } }
            ),
            titleVisibility: .visible
        ) {
            Button(Strings.commonDelete, role: .destructive, action: viewModel.deleteConfirmed)
            Button(Strings.commonCancel, role: .cancel, action: viewModel.cancelDelete)
        } message: {
            Text(Strings.tripsDeleteBody)
        }
    }

    private func segmentControl(_ viewModel: MyTripsViewModel) -> some View {
        HStack(spacing: AppSpacing.xs) {
            ForEach(TripSegment.allCases) { segment in
                let selected = viewModel.segment == segment
                Button {
                    viewModel.segment = segment
                } label: {
                    Text(segment.label)
                        .font(AppTypography.label)
                        .foregroundStyle(selected ? AppColors.onPrimary : AppColors.onSurface)
                        .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                        .background(selected ? AppColors.primary : AppColors.surface, in: Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier(segment.testID)
                .accessibilityAddTraits(selected ? [.isSelected] : [])
            }
        }
    }

    private func emptyState(_ viewModel: MyTripsViewModel) -> some View {
        VStack(spacing: AppSpacing.md) {
            Spacer()
            Text(viewModel.emptyTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(viewModel.emptyBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .multilineTextAlignment(.leading)
            if viewModel.showsPlanAction {
                Button(Strings.tripsPlan, action: viewModel.plan)
                    .buttonStyle(.primary)
                    .accessibilityIdentifier("trips.plan")
            }
            Spacer()
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityIdentifier("trips.empty")
    }

    private func tripCard(_ trip: Trip, viewModel: MyTripsViewModel) -> some View {
        ZStack(alignment: .topTrailing) {
            Button {
                viewModel.open(trip)
            } label: {
                VStack(alignment: .leading, spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        RemoteImage(
                            urlString: viewModel.destination(for: trip)?.imageUrl ?? "",
                            fallbackURLString: viewModel.fallbackImageURL,
                            accessibilityName: trip.title
                        )
                        .frame(height: AppSize.cardImage)
                        .frame(maxWidth: .infinity)
                        PhotoScrim()
                        OverlayTitle(title: trip.title)
                            .padding(AppSpacing.md)
                    }
                    .frame(height: AppSize.cardImage)
                    Text(viewModel.datesText(for: trip))
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .padding(AppSpacing.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(AppColors.surface)
                }
                .photoCardChrome()
            }
            .buttonStyle(.plain)
            .cardAccessibility(label: trip.title, identifier: TestIDs.tripsCard(trip.id))

            HeartlessDeleteButton {
                viewModel.confirmDelete(trip)
            }
            .accessibilityIdentifier(TestIDs.tripsDelete(trip.id))
            .padding(AppSpacing.sm)
        }
    }
}

private struct HeartlessDeleteButton: View {
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(AppIcon.trash)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(AppColors.onOverlay)
                .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                .background(AppColors.overlay.opacity(0.55), in: Circle())
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Strings.tripsDeleteTitle)
    }
}

#Preview {
    NavigationStack {
        MyTripsScreen()
    }
    .environment(AppContainer.preview())
}
