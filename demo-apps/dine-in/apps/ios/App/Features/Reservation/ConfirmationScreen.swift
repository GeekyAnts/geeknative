import SwiftUI

/// The premium "invitation" shown after confirming or saving a reservation.
struct ConfirmationScreen: View {
    @State private var viewModel: ReservationDetailViewModel
    @State private var calendarEvent: CalendarEvent?
    @State private var confirmingCancel = false
    @State private var cardShown = false
    @Environment(AppRouter.self) private var router
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: ReservationDetailViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ZStack {
            AppColors.espresso.ignoresSafeArea()
            RadialGradient(colors: [AppColors.accent.opacity(0.28), AppColors.accent.opacity(0)], center: .top, startRadius: 0, endRadius: AppSize.heroHeight)
                .ignoresSafeArea()
                .accessibilityHidden(true)
            if viewModel.isLoading {
                ProgressView().tint(AppColors.accent)
            } else if let reservation = viewModel.reservation, let restaurant = viewModel.restaurant {
                content(reservation, restaurant)
            } else {
                EmptyState(icon: AppIcon.calendar, title: Strings.reservationNotFoundTitle, message: Strings.reservationNotFoundBody)
                    .background(AppColors.background, in: .rect(cornerRadius: AppRadius.xl))
                    .padding(AppSpacing.lg)
                    .accessibilityIdentifier("reservation.notFound")
                    .overlay(alignment: .topLeading) { TopBar(overImage: true) }
            }
        }
        .task { await viewModel.load() }
        .sheet(item: $calendarEvent) { event in
            CalendarEventEditor(event: event) { calendarEvent = nil }
                .ignoresSafeArea()
        }
        .confirmationDialog(Strings.cancelTitle, isPresented: $confirmingCancel, titleVisibility: .visible) {
            Button(Strings.cancelConfirm, role: .destructive) {
                Task {
                    if await viewModel.cancel() {
                        router.openReservations(.cancelled)
                    }
                }
            }
            Button(Strings.cancelKeep, role: .cancel) {}
        } message: {
            Text(viewModel.cancelMessage)
        }
    }

    private func content(_ reservation: Reservation, _ restaurant: Restaurant) -> some View {
        ScrollView {
            VStack(spacing: AppSpacing.xl) {
                SuccessCheck()
                    .padding(.top, AppSpacing.xxl)
                VStack(spacing: AppSpacing.sm) {
                    Overline(Strings.confirmationOverline)
                    Text(Strings.confirmationTitle)
                        .font(AppSerif.hero)
                        .foregroundStyle(AppColors.onEspresso)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                    Text(Strings.confirmationBody(restaurant: restaurant.name))
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onEspresso.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
                .reveal(1)
                InvitationCard(reservation: reservation, restaurant: restaurant, codeTestID: "confirmation.code", restaurantTestID: "confirmation.restaurant")
                    .rotation3DEffect(.degrees(cardShown || reduceMotion ? 0 : 8), axis: (x: 1, y: 0, z: 0.2), anchor: .bottom)
                    .rotationEffect(.degrees(cardShown || reduceMotion ? 0 : -2))
                    .opacity(cardShown || reduceMotion ? 1 : 0)
                    .offset(y: cardShown || reduceMotion ? 0 : AppSpacing.xxl)
                    .shadow(AppElevation.high)
                if reservation.isUpcoming(now: viewModel.session.now()) {
                    actions(reservation, restaurant).reveal(3)
                }
                VStack(spacing: AppSpacing.sm) {
                    PrimaryButton(title: Strings.confirmationDone, fill: AppColors.accent, foreground: AppColors.onAccent) {
                        router.pop()
                    }
                    .accessibilityIdentifier("confirmation.done")
                    Button {
                        router.openReservations(.upcoming)
                    } label: {
                        Text(Strings.confirmationViewReservations)
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.onEspresso)
                            .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                    }
                    .accessibilityIdentifier("confirmation.viewReservations")
                }
                .reveal(4)
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.xxl)
        }
        .scrollIndicators(.hidden)
        .onAppear {
            withAnimation(AppMotion.reduced(AppMotion.gentle.delay(AppMotion.slow), reduceMotion)) { cardShown = true }
        }
    }

    private func actions(_ reservation: Reservation, _ restaurant: Restaurant) -> some View {
        VStack(spacing: AppSpacing.md) {
            HStack(alignment: .top, spacing: AppSpacing.md) {
                LabelledActionButton(icon: AppIcon.directions, label: Strings.confirmationDirections) {
                    if let url = RestaurantViewModel.directionsURL(restaurant) { openURL(url) }
                }
                .accessibilityIdentifier("confirmation.directions")
                LabelledActionButton(icon: AppIcon.addToCalendar, label: Strings.confirmationAddToCalendar) {
                    calendarEvent = viewModel.calendarEvent
                }
                .accessibilityIdentifier("confirmation.addToCalendar")
                LabelledActionButton(icon: AppIcon.edit, label: Strings.confirmationModify) {
                    router.push(.reserve(restaurantId: reservation.restaurantId, reservationId: reservation.id))
                }
                .accessibilityIdentifier("confirmation.modify")
            }
            Button {
                confirmingCancel = true
            } label: {
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.cancelReservation)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .foregroundStyle(AppColors.error)
                    Text(Strings.confirmationCancel)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onEspresso)
                        .underline(color: AppColors.error)
                }
                .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
            }
            .accessibilityIdentifier("confirmation.cancel")
        }
    }
}

/// A gold circle outline draws itself, a check scales in, then a soft gold ring pulses once.
/// Reduced motion shows the final state.
struct SuccessCheck: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var drawn: CGFloat = 0
    @State private var checkScale: CGFloat = 0
    @State private var pulse = false
    @State private var done = false
    private let size = AppSize.avatarLarge

    var body: some View {
        ZStack {
            Circle()
                .stroke(AppColors.accent.opacity(pulse ? 0 : 0.6), lineWidth: AppSize.hairline * 2)
                .scaleEffect(pulse ? 1.6 : 1)
            Circle()
                .trim(from: 0, to: drawn)
                .stroke(AppColors.accent, style: StrokeStyle(lineWidth: AppSize.hairline * 2, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Image(AppIcon.check)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.xl, height: AppIconSize.xl)
                .foregroundStyle(AppColors.accent)
                .scaleEffect(checkScale)
        }
        .frame(width: size, height: size)
        .sensoryFeedback(.success, trigger: done)
        .accessibilityHidden(true)
        .onAppear(perform: play)
    }

    private func play() {
        guard !reduceMotion else {
            drawn = 1
            checkScale = 1
            pulse = true
            done = true
            return
        }
        withAnimation(AppMotion.standard(AppMotion.slow)) {
            drawn = 1
        } completion: {
            done = true
            withAnimation(AppMotion.gentle) {
                checkScale = 1
            } completion: {
                withAnimation(AppMotion.decelerate(AppMotion.page)) { pulse = true }
            }
        }
    }
}

#Preview {
    let session = MemberSession.preview()
    NavigationStack {
        ConfirmationScreen(viewModel: ReservationDetailViewModel(session: session, reservationId: UITesting.upcomingReservationId))
    }
    .environment(session)
    .environment(session.router)
}
