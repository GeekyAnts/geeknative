import SwiftUI

struct ItineraryScreen: View {
    let tripId: String
    @Environment(AppContainer.self) private var container
    @State private var viewModel: ItineraryViewModel?

    var body: some View {
        ZStack {
            AppColors.background
            if let viewModel, let trip = viewModel.trip {
                content(trip, viewModel: viewModel)
            }
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear {
            if viewModel == nil {
                viewModel = ItineraryViewModel(tripId: tripId, container: container)
            }
        }
    }

    private func content(_ trip: Trip, viewModel: ItineraryViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                hero(trip, viewModel: viewModel)
                if let budget = viewModel.budget {
                    budgetCard(budget, viewModel: viewModel)
                        .padding(.horizontal, AppSpacing.lg)
                }
                ForEach(trip.days) { day in
                    daySection(day, viewModel: viewModel)
                }
                Button(Strings.itinerarySaveTrip) {
                    viewModel.saveTrip()
                }
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("itinerary.saveTrip")
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
        }
        .ignoresSafeArea(edges: .top)
        .sheet(isPresented: Binding(
            get: { viewModel.addingToDay != nil },
            set: { if !$0 { viewModel.addingToDay = nil } }
        )) {
            if let dayIndex = viewModel.addingToDay {
                addPlaceSheet(dayIndex: dayIndex, viewModel: viewModel)
            }
        }
    }

    private func hero(_ trip: Trip, viewModel: ItineraryViewModel) -> some View {
        ZStack(alignment: .bottomLeading) {
            RemoteImage(
                urlString: viewModel.destination?.imageUrl ?? "",
                fallbackURLString: viewModel.fallbackImageURL,
                accessibilityName: trip.title
            )
            .frame(height: AppSize.hero)
            .frame(maxWidth: .infinity)
            PhotoScrim()
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                OverlayTitle(title: trip.title, display: true)
                Text(viewModel.datesText(for: trip))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onOverlay)
                Text(Strings.itineraryTravelers(count: trip.travelers))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onOverlay)
            }
            .padding(AppSpacing.lg)
        }
        .frame(height: AppSize.hero)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .padding(.horizontal, AppSpacing.lg)
        .shadow(AppElevation.low)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("itinerary.hero")
    }

    private func budgetCard(_ budget: BudgetBreakdown, viewModel: ItineraryViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.itineraryBudgetTitle)
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onSurface)
            budgetRow(Strings.itineraryBudgetLodging, viewModel.amount(budget.lodging, symbol: budget.symbol))
            budgetRow(Strings.itineraryBudgetFood, viewModel.amount(budget.food, symbol: budget.symbol))
            budgetRow(Strings.itineraryBudgetActivities, viewModel.amount(budget.activities, symbol: budget.symbol))
            Divider()
            budgetRow(Strings.itineraryBudgetTotal, viewModel.amount(budget.total, symbol: budget.symbol))
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .shadow(AppElevation.low)
        .accessibilityIdentifier("itinerary.budget")
    }

    private func budgetRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Spacer()
            Text(value)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
        }
    }

    private func daySection(_ day: TripDay, viewModel: ItineraryViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(Strings.itineraryDayTitle(day: AppFormat.int(day.dayIndex)))
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.onBackground)
                    Text(AppFormat.mediumDate(day.date))
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                }
                Spacer()
                Button {
                    viewModel.addingToDay = day.dayIndex
                } label: {
                    Image(AppIcon.plus)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.onPrimary)
                        .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                        .background(AppColors.primary, in: Circle())
                }
                .accessibilityLabel(Strings.itineraryAdd)
                .accessibilityIdentifier(TestIDs.itineraryAdd(day.dayIndex))
            }
            .padding(.horizontal, AppSpacing.lg)

            if day.items.isEmpty {
                Text(Strings.itineraryEmptyDay)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .padding(.horizontal, AppSpacing.lg)
            } else {
                ForEach(Array(day.items.enumerated()), id: \.element.id) { index, item in
                    itemCard(item, day: day, index: index, viewModel: viewModel)
                        .padding(.horizontal, AppSpacing.lg)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(TestIDs.itineraryDay(day.dayIndex))
    }

    private func itemCard(_ item: TripItem, day: TripDay, index: Int, viewModel: ItineraryViewModel) -> some View {
        let place = viewModel.place(for: item)
        let completed = item.completed
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                if let place { viewModel.openPlace(place) }
            } label: {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    RemoteImage(
                        urlString: place?.imageUrl ?? "",
                        fallbackURLString: viewModel.fallbackImageURL,
                        accessibilityName: place?.name ?? item.placeId
                    )
                    .frame(width: AppSize.thumb, height: AppSize.thumb)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(place?.name ?? item.placeId)
                            .font(AppTypography.title)
                            .foregroundStyle(completed ? AppColors.onSurfaceVariant : AppColors.onSurface)
                        Text(viewModel.timeDuration(for: item))
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                        if let summary = place?.summary {
                            Text(summary)
                                .font(AppTypography.body)
                                .foregroundStyle(completed ? AppColors.onSurfaceVariant : AppColors.onSurface)
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(AppSpacing.md)
            }
            .buttonStyle(.plain)

            HStack(spacing: AppSpacing.sm) {
                iconAction(
                    icon: AppIcon.checkCircle,
                    label: completed ? Strings.itineraryIncomplete : Strings.itineraryComplete,
                    identifier: TestIDs.itineraryComplete(item.id),
                    enabled: true
                ) {
                    viewModel.toggleComplete(item, on: day)
                }
                iconAction(
                    icon: AppIcon.chevronUp,
                    label: Strings.itineraryMoveUp,
                    identifier: TestIDs.itineraryMoveUp(item.id),
                    enabled: index > 0
                ) {
                    viewModel.moveUp(item, on: day)
                }
                iconAction(
                    icon: AppIcon.chevronDown,
                    label: Strings.itineraryMoveDown,
                    identifier: TestIDs.itineraryMoveDown(item.id),
                    enabled: index < day.items.count - 1
                ) {
                    viewModel.moveDown(item, on: day)
                }
                iconAction(
                    icon: AppIcon.trash,
                    label: Strings.itineraryRemove,
                    identifier: TestIDs.itineraryRemove(item.id),
                    enabled: true
                ) {
                    viewModel.remove(item, on: day)
                }
            }
            .padding(.horizontal, AppSpacing.md)
            .padding(.bottom, AppSpacing.sm)
        }
        .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .shadow(AppElevation.low)
        .accessibilityIdentifier(TestIDs.itineraryItem(item.id))
    }

    private func iconAction(icon: ImageResource, label: String, identifier: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(icon)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(enabled ? AppColors.onSurface : AppColors.onSurfaceVariant)
                .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityLabel(label)
        .accessibilityIdentifier(identifier)
    }

    private func addPlaceSheet(dayIndex: Int, viewModel: ItineraryViewModel) -> some View {
        let day = viewModel.trip?.days.first { $0.dayIndex == dayIndex }
        return NavigationStack {
            List(day.map { viewModel.addablePlaces(for: $0) } ?? []) { place in
                Button {
                    if let day {
                        viewModel.add(place, to: day)
                    }
                } label: {
                    HStack(spacing: AppSpacing.md) {
                        RemoteImage(
                            urlString: place.imageUrl,
                            fallbackURLString: viewModel.fallbackImageURL,
                            accessibilityName: place.name
                        )
                        .frame(width: AppSize.thumb, height: AppSize.thumb)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text(place.name)
                                .font(AppTypography.title)
                                .foregroundStyle(AppColors.onSurface)
                            Text(place.kind.label)
                                .font(AppTypography.caption)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        }
                    }
                }
            }
            .navigationTitle(Strings.itineraryAddPlaceTitle)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(Strings.commonCancel) {
                        viewModel.addingToDay = nil
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        ItineraryScreen(tripId: "preview")
    }
    .environment(AppContainer.preview())
}
