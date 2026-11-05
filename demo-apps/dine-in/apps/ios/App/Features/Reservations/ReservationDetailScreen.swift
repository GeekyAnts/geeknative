import SwiftUI

/// One reservation: hero photo with status, the invitation card and actions by status.
struct ReservationDetailScreen: View {
    @State private var viewModel: ReservationDetailViewModel
    @State private var calendarEvent: CalendarEvent?
    @State private var confirmingCancel = false
    @Environment(AppRouter.self) private var router
    @Environment(\.openURL) private var openURL

    init(viewModel: ReservationDetailViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                Group {
                    if viewModel.isLoading {
                        VStack(spacing: AppSpacing.lg) {
                            Skeleton(cornerRadius: AppRadius.xl).frame(height: AppSize.listImageHeight)
                            Skeleton(cornerRadius: AppRadius.lg).frame(height: AppSize.featuredCardHeight)
                        }
                    } else if let reservation = viewModel.reservation, let restaurant = viewModel.restaurant, let phase = viewModel.phase {
                        content(reservation, restaurant, phase)
                    } else {
                        EmptyState(icon: AppIcon.calendar, title: Strings.reservationNotFoundTitle, message: Strings.reservationNotFoundBody)
                            .accessibilityIdentifier("reservation.notFound")
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSize.touchTarget + AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
            .scrollIndicators(.hidden)
            TopBar(title: Strings.reservationTitle, isScrolled: true)
        }
        .background(AppColors.background.ignoresSafeArea())
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

    private func content(_ reservation: Reservation, _ restaurant: Restaurant, _ phase: ReservationPhase) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xl) {
            RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                .frame(height: AppSize.listImageHeight)
                .clipShape(.rect(cornerRadius: AppRadius.xl, style: .continuous))
                .overlay(alignment: .topLeading) {
                    StatusPill(phase: phase).padding(AppSpacing.md)
                }
                .reveal(0)
            InvitationCard(reservation: reservation, restaurant: restaurant, codeTestID: "reservation.code")
                .reveal(1)
            Group {
                if phase == .upcoming {
                    upcomingActions(reservation, restaurant)
                } else {
                    VStack(spacing: AppSpacing.md) {
                        PrimaryButton(title: Strings.reservationsRebook, icon: AppIcon.rebook) {
                            router.push(.reserve(restaurantId: reservation.restaurantId, rebookFromId: reservation.id))
                        }
                        SecondaryButton(title: Strings.reservationsViewRestaurant, icon: AppIcon.utensils) {
                            router.push(.restaurant(reservation.restaurantId))
                        }
                    }
                }
            }
            .reveal(2)
        }
    }

    private func upcomingActions(_ reservation: Reservation, _ restaurant: Restaurant) -> some View {
        VStack(spacing: AppSpacing.md) {
            HStack(alignment: .top, spacing: AppSpacing.md) {
                LabelledActionButton(icon: AppIcon.directions, label: Strings.confirmationDirections, onDark: false) {
                    if let url = RestaurantViewModel.directionsURL(restaurant) { openURL(url) }
                }
                LabelledActionButton(icon: AppIcon.addToCalendar, label: Strings.confirmationAddToCalendar, onDark: false) {
                    calendarEvent = viewModel.calendarEvent
                }
                LabelledActionButton(icon: AppIcon.edit, label: Strings.confirmationModify, onDark: false) {
                    router.push(.reserve(restaurantId: reservation.restaurantId, reservationId: reservation.id))
                }
            }
            SecondaryButton(title: Strings.reservationsCancel, icon: AppIcon.cancelReservation, tint: AppColors.error) {
                confirmingCancel = true
            }
        }
    }
}

#Preview {
    let session = MemberSession.preview()
    NavigationStack {
        ReservationDetailScreen(viewModel: ReservationDetailViewModel(session: session, reservationId: UITesting.upcomingReservationId))
    }
    .environment(session)
    .environment(session.router)
}
