import SwiftUI

/// The member's reservations: upcoming, past and cancelled.
struct ReservationsScreen: View {
    @State private var viewModel: ReservationsViewModel
    @State private var pendingCancel: Reservation?
    @Namespace private var segmentNamespace
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: ReservationsViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                ScreenHeader(overline: Strings.reservationsSubtitle, title: Strings.reservationsTitle)
                segmentedControl
                switch viewModel.state {
                case .loading:
                    ForEach(0..<2, id: \.self) { _ in
                        Skeleton(cornerRadius: AppRadius.lg).frame(height: AppSize.featuredCardWidth)
                    }
                case .failed:
                    ErrorState { Task { await viewModel.retry() } }
                case .loaded:
                    list
                        .id(viewModel.segment)
                        .transition(.opacity)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.top, AppSpacing.sm)
            .tabBarClearance()
        }
        .scrollIndicators(.hidden)
        .background(AppColors.background.ignoresSafeArea())
        .task { await viewModel.load() }
        .onChange(of: router.reservationsRequest, initial: true) { _, request in
            guard let request else { return }
            viewModel.segment = request.segment
            router.reservationsRequest = nil
        }
        .confirmationDialog(
            Strings.cancelTitle,
            isPresented: Binding(get: { pendingCancel != nil }, set: { if !$0 { pendingCancel = nil } }),
            titleVisibility: .visible,
            presenting: pendingCancel
        ) { reservation in
            Button(Strings.cancelConfirm, role: .destructive) {
                Task {
                    await viewModel.cancel(reservation)
                    withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) {}
                }
            }
            Button(Strings.cancelKeep, role: .cancel) {}
        } message: { reservation in
            Text(Strings.cancelBody(
                restaurant: viewModel.restaurant(reservation)?.name ?? reservation.restaurantId,
                date: Formatters.dateShort(iso: reservation.date),
                time: Formatters.time(reservation.time)
            ))
        }
        .animation(AppMotion.reduced(AppMotion.gentle, reduceMotion), value: viewModel.groups.mapValues { $0.map(\.id) })
    }

    private var segmentedControl: some View {
        let groups = viewModel.groups
        return HStack(spacing: AppSpacing.xs) {
            ForEach(ReservationsSegment.allCases) { segment in
                let selected = segment == viewModel.segment
                Button {
                    withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.segment = segment }
                } label: {
                    HStack(spacing: AppSpacing.xs) {
                        Text(segment.label)
                            .font(AppTypography.label)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        Text(verbatim: String(groups[segment]?.count ?? 0))
                            .font(AppTypography.caption)
                            .opacity(0.75)
                            .contentTransition(.numericText())
                    }
                    .foregroundStyle(selected ? AppColors.onEspresso : AppColors.onSurface)
                    .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                    .background {
                        if selected {
                            Capsule().fill(AppColors.espresso)
                                .matchedGeometryEffect(id: "segmentPill", in: segmentNamespace)
                        }
                    }
                    .contentShape(.capsule)
                }
                .buttonStyle(.pressable)
                .accessibilityAddTraits(selected ? .isSelected : [])
                .accessibilityIdentifier("reservations.segment.\(segment.rawValue)")
            }
        }
        .padding(AppSpacing.xs)
        .glassCapsule()
        .sensoryFeedback(.selection, trigger: viewModel.segment)
    }

    @ViewBuilder
    private var list: some View {
        let items = viewModel.reservations(in: viewModel.segment)
        if items.isEmpty {
            emptyState
        } else {
            VStack(spacing: AppSpacing.lg) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, reservation in
                    card(reservation)
                        .reveal(index)
                        .transition(.asymmetric(insertion: .opacity, removal: .opacity.combined(with: .scale(scale: 0.9))))
                }
            }
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        switch viewModel.segment {
        case .upcoming:
            EmptyState(
                icon: AppIcon.calendar,
                title: Strings.reservationsEmptyUpcomingTitle,
                message: Strings.reservationsEmptyUpcomingBody,
                actionTitle: Strings.reservationsEmptyCta,
                action: { router.switchTab(.discover) }
            )
            .accessibilityIdentifier("reservations.empty")
        case .past:
            EmptyState(icon: AppIcon.clock, title: Strings.reservationsEmptyPastTitle, message: Strings.reservationsEmptyPastBody)
                .accessibilityIdentifier("reservations.empty")
        case .cancelled:
            EmptyState(icon: AppIcon.cancelReservation, title: Strings.reservationsEmptyCancelledTitle, message: Strings.reservationsEmptyCancelledBody)
                .accessibilityIdentifier("reservations.empty")
        }
    }

    private func card(_ reservation: Reservation) -> some View {
        let restaurant = viewModel.restaurant(reservation)
        let phase = reservation.phase(now: viewModel.session.now())
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                router.push(.reservation(reservation.id))
            } label: {
                VStack(alignment: .leading, spacing: 0) {
                    RemoteImage(url: restaurant?.heroImage ?? "", label: restaurant?.name)
                        .aspectRatio(3, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .overlay(alignment: .topLeading) {
                            StatusPill(phase: phase).padding(AppSpacing.md)
                        }
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(restaurant?.name ?? reservation.restaurantId)
                            .font(AppSerif.title)
                            .foregroundStyle(AppColors.onSurface)
                        Text(Formatters.dateAndTime(iso: reservation.date, time: reservation.time))
                            .font(AppTypography.subtitle)
                            .foregroundStyle(AppColors.onSurface)
                        Text(Strings.formatSeparator(first: Strings.reserveGuestCount(count: reservation.partySize), second: reservation.seating.label))
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                        Text(reservation.confirmationCode)
                            .font(AppTypography.caption)
                            .tracking(AppSize.tracking)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                    }
                    .multilineTextAlignment(.leading)
                    .padding([.horizontal, .top], AppSpacing.lg)
                    .padding(.bottom, AppSpacing.md)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(.rect)
            }
            .buttonStyle(.pressable)
            .accessibilityIdentifier("reservations.card.\(reservation.id)")

            HStack(spacing: AppSpacing.sm) {
                ForEach(ReservationsViewModel.actions(for: phase), id: \.self) { action in
                    cardAction(action, reservation)
                }
            }
            .padding([.horizontal, .bottom], AppSpacing.lg)
        }
        .background(AppColors.surface)
        .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
    }

    @ViewBuilder
    private func cardAction(_ action: ReservationsViewModel.CardAction, _ reservation: Reservation) -> some View {
        switch action {
        case .modify:
            SmallActionButton(title: Strings.reservationsModify, icon: AppIcon.edit, prominent: false) {
                router.push(.reserve(restaurantId: reservation.restaurantId, reservationId: reservation.id))
            }
            .accessibilityIdentifier("reservations.modify.\(reservation.id)")
        case .cancel:
            SmallActionButton(title: Strings.reservationsCancel, icon: AppIcon.cancelReservation, prominent: false, tint: AppColors.error) {
                pendingCancel = reservation
            }
            .accessibilityIdentifier("reservations.cancel.\(reservation.id)")
        case .rebook:
            SmallActionButton(title: Strings.reservationsRebook, icon: AppIcon.rebook, prominent: true) {
                router.push(.reserve(restaurantId: reservation.restaurantId, rebookFromId: reservation.id))
            }
            .accessibilityIdentifier("reservations.rebook.\(reservation.id)")
        }
    }
}

/// A compact primary or secondary button for card actions.
private struct SmallActionButton: View {
    let title: String
    let icon: ImageResource
    let prominent: Bool
    var tint = AppColors.primary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ButtonLabel(title: title, icon: icon)
                .font(AppTypography.label)
                .foregroundStyle(prominent ? AppColors.onEspresso : tint)
                .padding(.horizontal, AppSpacing.lg)
                .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                .background(prominent ? AppColors.espresso : .clear, in: .capsule)
                .overlay(Capsule().strokeBorder(prominent ? .clear : tint, lineWidth: AppSize.hairline))
                .contentShape(.capsule)
        }
        .buttonStyle(.pressable)
    }
}

#Preview {
    let session = MemberSession.preview()
    ReservationsScreen(viewModel: ReservationsViewModel(session: session))
        .environment(session)
        .environment(session.router)
}
