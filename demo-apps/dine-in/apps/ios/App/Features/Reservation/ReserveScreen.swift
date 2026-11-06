import SwiftUI

/// Reserve a table in three steps: details, preferences and review.
struct ReserveScreen: View {
    @State private var viewModel: ReserveViewModel
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: ReserveViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .loading:
                ZStack(alignment: .top) {
                    AppColors.espresso.ignoresSafeArea()
                    VStack(spacing: AppSpacing.lg) {
                        ForEach(0..<3, id: \.self) { _ in
                            Skeleton(cornerRadius: AppRadius.xl).frame(height: AppSize.collectionCardWidth / 1.5)
                        }
                    }
                    .padding(.horizontal, AppSpacing.lg)
                    .padding(.top, AppSize.touchTarget * 3)
                    TopBar(overImage: true)
                }
            case .failed:
                centered { ErrorState { Task { await viewModel.load() } } }
            case .restaurantNotFound:
                centered {
                    EmptyState(icon: AppIcon.utensils, title: Strings.restaurantNotFoundTitle, message: Strings.restaurantNotFoundBody)
                        .accessibilityIdentifier("restaurant.notFound")
                }
            case .reservationNotFound:
                centered {
                    EmptyState(icon: AppIcon.calendar, title: Strings.reservationNotFoundTitle, message: Strings.reservationNotFoundBody)
                        .accessibilityIdentifier("reservation.notFound")
                }
            case .ready(let restaurant):
                ready(restaurant)
            }
        }
        .task { await viewModel.load() }
    }

    private func centered(@ViewBuilder _ content: () -> some View) -> some View {
        VStack { content() }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(AppColors.background.ignoresSafeArea())
            .overlay(alignment: .top) { TopBar() }
    }

    private func ready(_ restaurant: Restaurant) -> some View {
        ZStack(alignment: .top) {
            backdrop(restaurant)
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.lg) {
                    header(restaurant)
                    progress
                    Group {
                        switch viewModel.step {
                        case .details: detailsStep
                        case .preferences: preferencesStep(restaurant)
                        case .review: reviewStep(restaurant)
                        }
                    }
                    .id(viewModel.step)
                    .transition(stepTransition)
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSize.touchTarget + AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            TopBar(overImage: true)
        }
        .safeAreaInset(edge: .bottom) { footer }
        .sensoryFeedback(.selection, trigger: viewModel.time)
    }

    private var stepTransition: AnyTransition {
        let forward = viewModel.movedForward
        return .asymmetric(
            insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
            removal: .move(edge: forward ? .leading : .trailing).combined(with: .opacity)
        )
    }

    private func animate(_ change: () -> Void) {
        withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion), change)
    }

    // MARK: - Chrome

    private func backdrop(_ restaurant: Restaurant) -> some View {
        GeometryReader { proxy in
            RemoteImage(url: restaurant.heroImage)
                .frame(width: proxy.size.width, height: proxy.size.height)
                .blur(radius: AppSize.blur)
                .overlay(AppColors.scrim)
                .overlay(AppColors.espresso.opacity(0.35))
        }
        .background(AppColors.espresso)
        .ignoresSafeArea()
        .accessibilityHidden(true)
    }

    private func header(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Overline(viewModel.isModifying ? Strings.reserveModifyTitle : Strings.reserveTitle)
                .accessibilityIdentifier("reserve.title")
            Text(restaurant.name)
                .font(AppSerif.headline)
                .foregroundStyle(AppColors.onGlassOnImage)
                .accessibilityAddTraits(.isHeader)
        }
    }

    private var progress: some View {
        let steps = ReserveViewModel.Step.allCases
        let current = viewModel.step
        return VStack(alignment: .leading, spacing: AppSpacing.sm) {
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(AppColors.onGlassOnImage.opacity(0.25))
                    Capsule().fill(AppColors.accent)
                        .frame(width: proxy.size.width * CGFloat(current.rawValue + 1) / CGFloat(steps.count))
                }
            }
            .frame(height: AppSpacing.xs)
            HStack(spacing: 0) {
                ForEach(steps, id: \.self) { step in
                    Button {
                        animate { viewModel.goBack(to: step) }
                    } label: {
                        Text(step.label)
                            .font(AppTypography.caption)
                            .foregroundStyle(step <= current ? AppColors.onGlassOnImage : AppColors.onGlassOnImage.opacity(0.6))
                            .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                            .contentShape(.rect)
                    }
                    .disabled(step >= current)
                }
            }
        }
        .animation(AppMotion.reduced(AppMotion.gentle, reduceMotion), value: current)
        .accessibilityElement(children: .contain)
        .accessibilityValue(Strings.reserveStepPosition(index: current.rawValue + 1, total: steps.count))
        .accessibilityIdentifier("reserve.progress")
    }

    private func panel(@ViewBuilder _ content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) { content() }
            .padding(AppSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassSurface(cornerRadius: AppRadius.xl, strong: true)
    }

    private func panelLabel(_ text: String) -> some View {
        Text(text)
            .font(AppTypography.subtitle)
            .foregroundStyle(AppColors.onSurface)
    }

    @ViewBuilder
    private var footer: some View {
        VStack(spacing: AppSpacing.sm) {
            if viewModel.step == .review, let error = viewModel.saveError {
                errorBanner(error)
            }
            switch viewModel.step {
            case .details:
                PrimaryButton(title: Strings.commonContinue) {
                    animate { viewModel.continueFromDetails() }
                }
                .opacity(viewModel.time == nil ? 0.4 : 1)
                .accessibilityIdentifier("reserve.continue")
            case .preferences:
                PrimaryButton(title: Strings.commonContinue) {
                    animate { viewModel.continueFromPreferences() }
                }
                .disabled(viewModel.notesTooLong)
                .accessibilityIdentifier("reserve.continue")
            case .review:
                PrimaryButton(title: viewModel.isModifying ? Strings.reserveSaveChanges : Strings.reserveConfirm, isBusy: viewModel.isSaving) {
                    Task {
                        let saved = await viewModel.save()
                        if let saved {
                            router.replaceTop(with: .confirmation(saved.id))
                        } else {
                            animate {}
                        }
                    }
                }
                .accessibilityIdentifier("reserve.confirm")
            }
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.top, AppSpacing.md)
        .padding(.bottom, AppSpacing.sm)
        .background {
            Rectangle().fill(.ultraThinMaterial).overlay(AppColors.glassStrong)
                .overlay(alignment: .top) { Rectangle().fill(AppColors.glassBorder).frame(height: AppSize.hairline) }
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: AppSpacing.sm) {
            Image(AppIcon.alert)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
            Text(message)
                .font(AppTypography.label)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .foregroundStyle(AppColors.onError)
        .padding(AppSpacing.md)
        .background(AppColors.error, in: .rect(cornerRadius: AppRadius.md))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("reserve.error")
    }

    // MARK: - Step 1 · Details

    private var detailsStep: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            panel { guests }
            panel { dates }
            panel { times }
            if let error = viewModel.detailsError {
                errorBanner(error)
            }
        }
    }

    private var guests: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                panelLabel(Strings.reserveGuests)
                Spacer()
                GlassIconButton(icon: AppIcon.minus, label: Strings.reserveRemoveGuest, isEnabled: viewModel.canRemoveGuest) {
                    withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.removeGuest() }
                }
                .accessibilityIdentifier("reserve.guests.decrease")
                Text(Strings.reserveGuestCount(count: viewModel.partySize))
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onSurface)
                    .contentTransition(.numericText(value: Double(viewModel.partySize)))
                    .frame(minWidth: AppSize.thumbnail)
                    .accessibilityIdentifier("reserve.guests.count")
                GlassIconButton(icon: AppIcon.plus, label: Strings.reserveAddGuest, isEnabled: viewModel.canAddGuest) {
                    withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.addGuest() }
                }
                .accessibilityIdentifier("reserve.guests.increase")
            }
            if viewModel.isAtMaxParty {
                Text(Strings.reserveLargeParty(max: viewModel.maxPartySize))
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityIdentifier("reserve.largeParty")
            }
        }
        .sensoryFeedback(.selection, trigger: viewModel.partySize)
    }

    private var dates: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                panelLabel(Strings.reserveDate)
                Spacer()
                Text(Formatters.monthYear(viewModel.date))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.primary)
            }
            ScrollViewReader { reader in
                ScrollView(.horizontal) {
                    HStack(spacing: AppSpacing.sm) {
                        ForEach(Array(viewModel.dates.enumerated()), id: \.element) { index, day in
                            dateChip(day, index: index).id(day)
                        }
                    }
                    .padding(.vertical, AppSpacing.xxs)
                }
                .scrollIndicators(.hidden)
                .onAppear { reader.scrollTo(viewModel.date, anchor: .center) }
            }
        }
    }

    private func dateChip(_ day: LocalDate, index: Int) -> some View {
        let selected = day == viewModel.date
        let weekday = switch index {
        case 0: Strings.reserveToday
        case 1: Strings.reserveTomorrow
        default: day.weekday.shortLabel
        }
        return Button {
            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.selectDate(day) }
        } label: {
            VStack(spacing: AppSpacing.xxs) {
                Text(weekday)
                    .font(AppTypography.caption)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text(verbatim: String(day.day))
                    .font(AppSerif.title)
            }
            .foregroundStyle(selected ? AppColors.onEspresso : AppColors.onSurface)
            .frame(width: AppSize.dateChipWidth)
            .padding(.vertical, AppSpacing.md)
            .background(selected ? AppColors.espresso : AppColors.surface, in: .rect(cornerRadius: AppRadius.md, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .strokeBorder(selected ? .clear : AppColors.outline, lineWidth: AppSize.hairline)
            }
            .opacity(viewModel.isClosed(day) && !selected ? 0.4 : 1)
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(Formatters.dateLong(day))
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("reserve.date.\(day.iso)")
    }

    private var times: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            panelLabel(Strings.reserveTime)
            if viewModel.isClosedDay {
                message(Strings.reserveClosedDay, icon: AppIcon.clock)
                    .accessibilityIdentifier("reserve.closed")
            } else if !viewModel.hasAvailableSlots {
                message(Strings.reserveNoSlots, icon: AppIcon.calendar)
                    .accessibilityIdentifier("reserve.noSlots")
            } else {
                FlowLayout {
                    ForEach(viewModel.slots, id: \.time) { slot in
                        let label = Formatters.time(slot.time)
                        Chip(label: label, isSelected: viewModel.time == slot.time, isEnabled: slot.available, strikethrough: !slot.available) {
                            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.selectTime(slot.time) }
                        }
                        .accessibilityLabel(slot.available ? label : Strings.reserveSlotUnavailable(time: label))
                        .accessibilityIdentifier(ReserveViewModel.timeTestID(slot.time))
                    }
                }
            }
            DemoNote()
        }
    }

    private func message(_ text: String, icon: ImageResource) -> some View {
        HStack(spacing: AppSpacing.sm) {
            Image(icon)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
            Text(text)
                .font(AppTypography.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(AppColors.onSurfaceVariant)
        .accessibilityElement(children: .combine)
    }

    // MARK: - Step 2 · Preferences

    private func preferencesStep(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            panel {
                panelLabel(Strings.reserveSeating)
                LazyVGrid(columns: [GridItem(.flexible(), spacing: AppSpacing.md), GridItem(.flexible(), spacing: AppSpacing.md)], spacing: AppSpacing.md) {
                    ForEach(restaurant.seating) { option in
                        seatingTile(option)
                    }
                }
            }
            panel {
                panelLabel(Strings.reserveOccasion)
                FlowLayout {
                    ForEach(Occasion.allCases) { option in
                        Chip(label: option.label, icon: option.icon, isSelected: viewModel.occasion == option) {
                            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.occasion = option }
                        }
                        .accessibilityIdentifier("reserve.occasion.\(option.rawValue)")
                    }
                }
            }
            panel {
                panelLabel(Strings.reserveDietary)
                FlowLayout {
                    ForEach(Dietary.allCases) { option in
                        Chip(label: option.label, isSelected: viewModel.dietary.contains(option)) {
                            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.toggleDietary(option) }
                        }
                        .accessibilityIdentifier("reserve.dietary.\(option.rawValue)")
                    }
                }
            }
            panel { notesField }
        }
    }

    private func seatingTile(_ option: Seating) -> some View {
        let selected = viewModel.seating == option
        return Button {
            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.seating = option }
        } label: {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Image(option.icon)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.lg, height: AppIconSize.lg)
                    .foregroundStyle(selected ? AppColors.accent : AppColors.primary)
                Text(option.label)
                    .font(AppTypography.label)
                    .foregroundStyle(selected ? AppColors.onEspresso : AppColors.onSurface)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppSpacing.lg)
            .background(selected ? AppColors.espresso : AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                    .strokeBorder(selected ? AppColors.accent : AppColors.outline, lineWidth: AppSize.hairline)
            }
        }
        .buttonStyle(.pressable)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("reserve.seating.\(option.rawValue)")
    }

    private var notesField: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            panelLabel(Strings.reserveNotes)
            TextField(Strings.reserveNotesPlaceholder, text: $viewModel.notes, axis: .vertical)
                .lineLimit(3...6)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .padding(AppSpacing.md)
                .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.md))
                .overlay {
                    RoundedRectangle(cornerRadius: AppRadius.md)
                        .strokeBorder(viewModel.notesTooLong ? AppColors.error : AppColors.outline, lineWidth: AppSize.hairline)
                }
                .accessibilityIdentifier("reserve.notes")
            HStack {
                if viewModel.notesTooLong {
                    Text(Strings.reserveErrorNotesTooLong(max: ReservationValidator.maxNotesLength))
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.error)
                }
                Spacer()
                Text(Strings.reserveNotesCount(count: viewModel.notes.count, max: ReservationValidator.maxNotesLength))
                    .font(AppTypography.caption)
                    .foregroundStyle(viewModel.notesTooLong ? AppColors.error : AppColors.onSurfaceVariant)
            }
        }
    }

    // MARK: - Step 3 · Review

    private func reviewStep(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Text(Strings.reserveReviewTitle)
                .font(AppSerif.title)
                .foregroundStyle(AppColors.onGlassOnImage)
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                HStack(spacing: AppSpacing.md) {
                    RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                        .frame(width: AppSize.avatarLarge * 0.75, height: AppSize.avatarLarge * 0.75)
                        .clipShape(.rect(cornerRadius: AppRadius.md, style: .continuous))
                    VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                        Overline(restaurant.cuisine.label)
                        Text(restaurant.name)
                            .font(AppSerif.title)
                            .foregroundStyle(AppColors.onSurface)
                    }
                }
                divider
                summaryGroup(edit: .details) {
                    summaryRow(Strings.reserveSummaryWhen, Formatters.longDateAndTime(iso: viewModel.date.iso, time: viewModel.time ?? ""))
                    summaryRow(Strings.reserveSummaryParty, Strings.reserveGuestCount(count: viewModel.partySize))
                }
                divider
                summaryGroup(edit: .preferences) {
                    summaryRow(Strings.reserveSummarySeating, viewModel.seating.label)
                    summaryRow(Strings.reserveSummaryOccasion, viewModel.occasion.label)
                    summaryRow(Strings.reserveSummaryDietary, viewModel.orderedDietary.isEmpty ? Strings.reserveSummaryNone : viewModel.orderedDietary.map(\.label).joined(separator: ", "))
                    summaryRow(Strings.reserveSummaryNotes, viewModel.notes.isEmpty ? Strings.reserveSummaryNone : viewModel.notes)
                }
            }
            .padding(AppSpacing.xl)
            .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.lg - AppSpacing.sm, style: .continuous)
                    .strokeBorder(AppColors.accent, lineWidth: AppSize.hairline)
                    .padding(AppSpacing.sm)
            }
            Text(Strings.reservePolicy)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onGlassOnImage.opacity(0.85))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var divider: some View {
        Rectangle().fill(AppColors.outline).frame(height: AppSize.hairline)
    }

    private func summaryGroup(edit step: ReserveViewModel.Step, @ViewBuilder rows: () -> some View) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: AppSpacing.md) { rows() }
            Spacer(minLength: 0)
            Button {
                animate { viewModel.goBack(to: step) }
            } label: {
                Text(Strings.reserveSummaryEdit)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.primary)
                    .frame(minWidth: AppSize.touchTarget, minHeight: AppSize.touchTarget, alignment: .topTrailing)
                    .contentShape(.rect)
            }
        }
    }

    private func summaryRow(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
            Overline(label, color: AppColors.onSurfaceVariant)
            Text(value)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    let session = MemberSession.preview()
    NavigationStack {
        ReserveScreen(viewModel: ReserveViewModel(session: session, restaurantId: "maison-lumiere"))
    }
    .environment(session)
    .environment(session.router)
}
