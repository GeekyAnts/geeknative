import Observation
import SwiftUI

@Observable
final class NotificationsViewModel {
    private(set) var catalog: Catalog?
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession) {
        self.session = session
    }

    func load() async {
        catalog = try? await session.catalogRepository.load()
    }

    var reminders: [Reservation] {
        Reminders.list(session.reservationsRepository.reservations, preferences: session.preferencesRepository.preferences, now: session.now())
    }

    func restaurantName(_ reservation: Reservation) -> String {
        catalog?.restaurant(reservation.restaurantId)?.name ?? reservation.restaurantId
    }
}

/// Reservation reminders: upcoming confirmed reservations within the next 7 days.
struct NotificationsScreen: View {
    @State private var viewModel: NotificationsViewModel
    @State private var scrolled = false
    @Environment(AppRouter.self) private var router

    init(viewModel: NotificationsViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    ScreenHeader(title: Strings.notificationsTitle)
                        .trackScrolled($scrolled)
                    let reminders = viewModel.reminders
                    if reminders.isEmpty {
                        EmptyState(icon: AppIcon.bell, title: Strings.notificationsEmptyTitle, message: Strings.notificationsEmptyBody)
                            .accessibilityIdentifier("notifications.empty")
                    } else {
                        VStack(spacing: AppSpacing.md) {
                            ForEach(Array(reminders.enumerated()), id: \.element.id) { index, reservation in
                                row(reservation).reveal(index)
                            }
                        }
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSize.touchTarget + AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
            TopBar(title: Strings.notificationsTitle, isScrolled: scrolled)
        }
        .background(AppColors.background.ignoresSafeArea())
        .task { await viewModel.load() }
    }

    private func row(_ reservation: Reservation) -> some View {
        Button {
            router.push(.reservation(reservation.id))
        } label: {
            HStack(alignment: .top, spacing: AppSpacing.md) {
                Image(AppIcon.bell)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    .foregroundStyle(AppColors.onAccent)
                    .frame(width: AppSize.avatar, height: AppSize.avatar)
                    .background(AppColors.accent, in: .circle)
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(Strings.notificationsReminder(
                        restaurant: viewModel.restaurantName(reservation),
                        date: Formatters.dateShort(iso: reservation.date),
                        time: Formatters.time(reservation.time)
                    ))
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                    .fixedSize(horizontal: false, vertical: true)
                    Text(reservation.confirmationCode)
                        .font(AppTypography.caption)
                        .tracking(AppSize.tracking)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(AppSpacing.lg)
            .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier("notifications.item.\(reservation.id)")
    }
}

#Preview {
    let session = MemberSession.preview()
    NavigationStack {
        NotificationsScreen(viewModel: NotificationsViewModel(session: session))
    }
    .environment(session)
    .environment(session.router)
}
