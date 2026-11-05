import EventKit
import EventKitUI
import SwiftUI

/// The reservation as a printed dining invitation (Confirmation and Reservation detail).
struct InvitationCard: View {
    let reservation: Reservation
    let restaurant: Restaurant
    let codeTestID: String
    var restaurantTestID: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                .frame(height: AppSize.thumbnail)
                .frame(maxWidth: .infinity)
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(restaurant.name)
                        .font(AppSerif.headline)
                        .foregroundStyle(AppColors.onSurface)
                        .accessibilityIdentifier(restaurantTestID ?? "")
                    Text(Formatters.longDateAndTime(iso: reservation.date, time: reservation.time))
                        .font(AppSerif.italic(.title))
                        .foregroundStyle(AppColors.primary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Line()
                    .stroke(AppColors.outline, style: StrokeStyle(lineWidth: AppSize.hairline, dash: [AppSpacing.xs, AppSpacing.xs]))
                    .frame(height: AppSize.hairline)
                Grid(alignment: .topLeading, horizontalSpacing: AppSpacing.lg, verticalSpacing: AppSpacing.md) {
                    GridRow {
                        item(Strings.reserveSummaryParty, Strings.reserveGuestCount(count: reservation.partySize))
                        item(Strings.reserveSummarySeating, reservation.seating.label)
                    }
                    GridRow {
                        item(Strings.reserveSummaryOccasion, reservation.occasion.label)
                        item(Strings.reserveSummaryDietary, reservation.dietary.isEmpty ? Strings.reserveSummaryNone : reservation.dietary.map(\.label).joined(separator: ", "))
                    }
                }
                if !reservation.notes.isEmpty {
                    item(Strings.reserveSummaryNotes, reservation.notes)
                }
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Overline(Strings.confirmationCode)
                    Text(reservation.confirmationCode)
                        .font(AppTypography.subtitle)
                        .tracking(AppSize.tracking * 2)
                        .foregroundStyle(AppColors.onSurface)
                        .textSelection(.enabled)
                        .accessibilityIdentifier(codeTestID)
                }
            }
            .padding(AppSpacing.xl)
        }
        .background(AppColors.surface)
        .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: AppRadius.lg - AppSpacing.sm, style: .continuous)
                .strokeBorder(AppColors.accent, lineWidth: AppSize.hairline)
                .padding(AppSpacing.sm)
                .allowsHitTesting(false)
        }
    }

    private func item(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Overline(label, color: AppColors.onSurfaceVariant)
            Text(value)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// A horizontal line, for the dashed divider.
private nonisolated struct Line: Shape {
    func path(in rect: CGRect) -> Path {
        Path { path in
            path.move(to: CGPoint(x: rect.minX, y: rect.midY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        }
    }
}

/// The reservation's status pill.
struct StatusPill: View {
    let phase: ReservationPhase

    var body: some View {
        let (text, fill, foreground): (String, Color, Color) = switch phase {
        case .upcoming: (Strings.reservationsStatusConfirmed, AppColors.success, AppColors.onSuccess)
        case .past: (Strings.reservationsStatusCompleted, AppColors.surfaceVariant, AppColors.onSurfaceVariant)
        case .cancelled: (Strings.reservationsStatusCancelled, AppColors.error, AppColors.onError)
        }
        Text(text.uppercased())
            .font(AppTypography.overline)
            .tracking(AppSize.tracking / 2)
            .foregroundStyle(foreground)
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, AppSpacing.xs)
            .background(fill, in: .capsule)
    }
}

/// A labelled round action (Directions, Add to calendar, Modify).
struct LabelledActionButton: View {
    let icon: ImageResource
    let label: String
    var onDark = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: AppSpacing.xs) {
                Image(icon)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(onDark ? AppColors.onGlassOnImage : AppColors.onSurface)
                    .frame(width: AppSize.touchTarget + AppSpacing.sm, height: AppSize.touchTarget + AppSpacing.sm)
                    .background {
                        if onDark {
                            Circle().fill(AppColors.glassOnImage).background(.ultraThinMaterial, in: .circle)
                                .overlay(Circle().strokeBorder(AppColors.glassBorder, lineWidth: AppSize.hairline))
                        } else {
                            Circle().fill(AppColors.surface)
                                .overlay(Circle().strokeBorder(AppColors.outline, lineWidth: AppSize.hairline))
                        }
                    }
                Text(label)
                    .font(AppTypography.caption)
                    .foregroundStyle(onDark ? AppColors.onEspresso : AppColors.onSurface)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
    }
}

/// The system add-to-calendar screen (no calendar permission needed on iOS 17).
struct CalendarEventEditor: UIViewControllerRepresentable {
    let event: CalendarEvent
    let onDone: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onDone: onDone) }

    func makeUIViewController(context: Context) -> EKEventEditViewController {
        let store = EKEventStore()
        let ekEvent = EKEvent(eventStore: store)
        ekEvent.title = event.title
        ekEvent.startDate = event.start
        ekEvent.endDate = event.end
        ekEvent.location = event.location
        ekEvent.notes = event.notes
        let controller = EKEventEditViewController()
        controller.eventStore = store
        controller.event = ekEvent
        controller.editViewDelegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: EKEventEditViewController, context: Context) {}

    final class Coordinator: NSObject, EKEventEditViewDelegate {
        let onDone: () -> Void

        init(onDone: @escaping () -> Void) {
            self.onDone = onDone
        }

        func eventEditViewController(_ controller: EKEventEditViewController, didCompleteWith action: EKEventEditViewAction) {
            onDone()
        }
    }
}

extension CalendarEvent: Identifiable {
    var id: Date { start }
}
