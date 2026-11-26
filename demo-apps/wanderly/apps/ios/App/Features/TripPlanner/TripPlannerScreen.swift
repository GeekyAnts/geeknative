import SwiftUI

struct TripPlannerScreen: View {
    var destinationId: String?
    @Environment(AppContainer.self) private var container
    @State private var viewModel: TripPlannerViewModel?

    var body: some View {
        ZStack {
            AppColors.background
            if let viewModel {
                form(viewModel)
            }
        }
        .navigationTitle(Strings.plannerTitle)
        .onAppear {
            if viewModel == nil {
                viewModel = TripPlannerViewModel(destinationId: destinationId, container: container)
            }
        }
    }

    private func form(_ viewModel: TripPlannerViewModel) -> some View {
        @Bindable var viewModel = viewModel
        return ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.plannerDestination)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    Picker(Strings.plannerDestination, selection: $viewModel.destinationId) {
                        Text(Strings.plannerDestinationPlaceholder).tag(Optional<String>.none)
                        ForEach(viewModel.destinations) { destination in
                            Text(destination.name).tag(Optional(destination.id))
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget, alignment: .leading)
                    .padding(.horizontal, AppSpacing.md)
                    .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                    .accessibilityIdentifier("planner.destination")
                    if viewModel.destinationErrorVisible {
                        Text(Strings.plannerDestinationError)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.error)
                    }
                }

                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    Text(Strings.plannerDates)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    dateButton(
                        label: Strings.plannerStartDate,
                        date: viewModel.startDate,
                        identifier: "planner.startDate"
                    ) {
                        viewModel.showStartPicker = true
                    }
                    dateButton(
                        label: Strings.plannerEndDate,
                        date: viewModel.endDate,
                        identifier: "planner.endDate"
                    ) {
                        viewModel.showEndPicker = true
                    }
                    if viewModel.dateErrorVisible {
                        Text(Strings.plannerDateError)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.error)
                            .accessibilityIdentifier("planner.dateError")
                    }
                    if viewModel.rangeErrorVisible {
                        Text(Strings.plannerRangeError)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.error)
                    }
                }

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.plannerTravelers)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    TravelersStepper(value: $viewModel.travelers, identifier: "planner.travelers")
                }

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.plannerBudget)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    BudgetBandRow(selection: $viewModel.budgetBand, identifier: TestIDs.plannerBudget)
                }

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(Strings.plannerInterests)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    CategoryChipRow(
                        selected: viewModel.interests,
                        identifier: TestIDs.plannerInterest,
                        onTap: viewModel.toggleInterest
                    )
                }

            }
            .padding(AppSpacing.lg)
            .padding(.bottom, AppSpacing.xxl)
        }
        .safeAreaInset(edge: .bottom) {
            Button(Strings.plannerGenerate, action: viewModel.generate)
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .shadow(AppElevation.high)
                .accessibilityIdentifier("planner.generate")
                .padding(.horizontal, AppSpacing.lg)
                .padding(.vertical, AppSpacing.md)
                .background(AppColors.background)
        }
        .sheet(isPresented: $viewModel.showStartPicker) {
            datePickerSheet(
                title: Strings.plannerStartDate,
                selection: $viewModel.startDate,
                isPresented: $viewModel.showStartPicker
            )
        }
        .sheet(isPresented: $viewModel.showEndPicker) {
            datePickerSheet(
                title: Strings.plannerEndDate,
                selection: $viewModel.endDate,
                isPresented: $viewModel.showEndPicker
            )
        }
    }

    private func dateButton(label: String, date: Date, identifier: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(label)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                Spacer()
                Text(AppFormat.mediumDate(TripDates.string(from: date)))
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(.horizontal, AppSpacing.md)
            .frame(minHeight: AppSize.touchTarget)
            .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(identifier)
    }

    private func datePickerSheet(title: String, selection: Binding<Date>, isPresented: Binding<Bool>) -> some View {
        NavigationStack {
            DatePicker(title, selection: selection, displayedComponents: .date)
                .datePickerStyle(.graphical)
                .padding(AppSpacing.md)
                .navigationTitle(title)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(Strings.commonCancel) { isPresented.wrappedValue = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(Strings.commonDone) { isPresented.wrappedValue = false }
                    }
                }
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    NavigationStack {
        TripPlannerScreen(destinationId: "bali")
    }
    .environment(AppContainer.preview())
}
