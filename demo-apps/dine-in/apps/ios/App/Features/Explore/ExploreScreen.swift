import SwiftUI

/// Search, filter, sort and browse every restaurant in the Club.
struct ExploreScreen: View {
    @State private var viewModel: ExploreViewModel
    @State private var showsFilters = false
    @State private var pinned = false
    @FocusState private var searchFocused: Bool
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: ExploreViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ScrollView {
            ScreenHeader(overline: Strings.exploreSubtitle, title: Strings.exploreTitle)
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSpacing.sm)
                .trackScrolled($pinned, threshold: AppSpacing.huge)
            LazyVStack(alignment: .leading, spacing: AppSpacing.lg, pinnedViews: [.sectionHeaders]) {
                Section {
                    switch viewModel.state {
                    case .loading:
                        ForEach(0..<3, id: \.self) { _ in
                            Skeleton(cornerRadius: AppRadius.lg)
                                .frame(height: AppSize.listImageHeight + AppSize.thumbnail)
                                .padding(.horizontal, AppSpacing.lg)
                        }
                    case .failed:
                        ErrorState { Task { await viewModel.retry() } }
                    case .loaded:
                        loaded
                    }
                } header: {
                    searchRow
                }
            }
            .tabBarClearance()
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .background(AppColors.background.ignoresSafeArea())
        .task { await viewModel.load() }
        .task(id: viewModel.searchText) {
            try? await Task.sleep(for: ExploreViewModel.searchDebounce)
            guard !Task.isCancelled else { return }
            withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.commitSearch() }
        }
        .onChange(of: router.exploreRequest, initial: true) { _, request in
            guard let request else { return }
            viewModel.apply(request)
            router.exploreRequest = nil
            if request.focusSearch {
                Task {
                    try? await Task.sleep(for: .seconds(AppMotion.normal))
                    searchFocused = true
                }
            }
        }
        .sheet(isPresented: $showsFilters) {
            FiltersSheet(viewModel: viewModel) {
                withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.applyDraft() }
                showsFilters = false
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
            .presentationBackground(AppColors.background)
        }
    }

    // MARK: - Search row

    private var searchRow: some View {
        HStack(spacing: AppSpacing.sm) {
            HStack(spacing: AppSpacing.sm) {
                Image(AppIcon.search)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(AppColors.primary)
                TextField(Strings.exploreSearchPlaceholder, text: $viewModel.searchText)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.search)
                    .focused($searchFocused)
                    .accessibilityIdentifier("explore.search")
                if !viewModel.searchText.isEmpty {
                    Button {
                        withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { viewModel.clearSearch() }
                    } label: {
                        Image(AppIcon.close)
                            .renderingMode(.template).resizable().scaledToFit()
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                            .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                            .contentShape(.rect)
                    }
                    .accessibilityLabel(Strings.exploreClearSearch)
                    .accessibilityIdentifier("explore.clearSearch")
                    .transition(.opacity.combined(with: .scale))
                }
            }
            .padding(.leading, AppSpacing.lg)
            .frame(height: AppSize.button)
            .glassCapsule(floating: pinned, strong: pinned)

            GlassIconButton(icon: AppIcon.filter, label: Strings.exploreFilters) {
                viewModel.beginEditing()
                showsFilters = true
            }
            .overlay(alignment: .topTrailing) {
                if viewModel.activeFilterCount > 0 {
                    Text(verbatim: String(viewModel.activeFilterCount))
                        .font(AppTypography.overline)
                        .foregroundStyle(AppColors.onAccent)
                        .frame(minWidth: AppSpacing.lg + AppSpacing.xs, minHeight: AppSpacing.lg + AppSpacing.xs)
                        .background(AppColors.accent, in: .circle)
                        .allowsHitTesting(false)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .accessibilityValue(viewModel.activeFilterCount > 0 ? String(viewModel.activeFilterCount) : "")
            .accessibilityIdentifier("explore.filtersButton")
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.sm)
        .background {
            if pinned {
                Rectangle().fill(AppColors.glassStrong).background(.ultraThinMaterial)
                    .ignoresSafeArea(edges: .top)
                    .transition(.opacity)
            }
        }
        .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: viewModel.searchText.isEmpty)
        .animation(AppMotion.reduced(AppMotion.standard(AppMotion.normal), reduceMotion), value: pinned)
        .animation(AppMotion.reduced(AppMotion.bouncy, reduceMotion), value: viewModel.activeFilterCount)
    }

    // MARK: - Content

    @ViewBuilder
    private var loaded: some View {
        quickChips
        resultsBar
        if viewModel.showsFeatured {
            featuredRow
        }
        let results = viewModel.results
        if results.isEmpty {
            EmptyState(
                icon: AppIcon.search,
                title: Strings.exploreEmptyTitle,
                message: Strings.exploreEmptyBody,
                actionTitle: viewModel.filters.hasActiveFilters ? Strings.exploreFilterClear : nil,
                actionTestID: "explore.clearFilters",
                action: {
                    withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.clearFilters() }
                }
            )
            .accessibilityIdentifier("explore.empty")
        } else {
            resultsList(results)
        }
        DemoNote()
            .padding(.horizontal, AppSpacing.lg)
    }

    private var quickChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: AppSpacing.sm) {
                if let collection = viewModel.filters.collection {
                    Chip(label: collection.title, trailingIcon: AppIcon.close, isSelected: true) {
                        withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.removeCollection() }
                    }
                    .accessibilityHint(Strings.exploreRemoveFilter)
                    .accessibilityIdentifier("explore.chip.collection")
                }
                Chip(label: Strings.exploreFilterAvailableToday, icon: AppIcon.clock, isSelected: viewModel.filters.availableToday) {
                    withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.toggleAvailableToday() }
                }
                .accessibilityIdentifier("explore.chip.availableToday")
                ForEach(CuisineId.allCases) { cuisine in
                    Chip(label: cuisine.label, isSelected: viewModel.filters.cuisines.contains(cuisine)) {
                        withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.toggleCuisine(cuisine) }
                    }
                    .accessibilityIdentifier("explore.chip.cuisine.\(cuisine.rawValue)")
                }
            }
        }
        .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
        .scrollIndicators(.hidden)
    }

    private var resultsBar: some View {
        HStack(spacing: AppSpacing.sm) {
            Text(Strings.exploreResults(count: viewModel.results.count))
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .contentTransition(.numericText())
                .accessibilityIdentifier("explore.resultsCount")
            Spacer(minLength: 0)
            Menu {
                Picker(Strings.exploreSort, selection: Binding(
                    get: { viewModel.sort },
                    set: { sort in withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.sort = sort } }
                )) {
                    ForEach(ExploreSort.allCases) { sort in
                        Text(sort.label).tag(sort)
                    }
                }
            } label: {
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.sort)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    Text(viewModel.sort.label)
                        .font(AppTypography.label)
                }
                .foregroundStyle(AppColors.primary)
                .frame(minHeight: AppSize.touchTarget)
                .contentShape(.rect)
            }
            .accessibilityLabel(Strings.exploreSort)
            .accessibilityValue(viewModel.sort.label)
            .accessibilityIdentifier("explore.sortButton")
            let next: ExploreViewMode = viewModel.viewMode == .list ? .grid : .list
            Button {
                withAnimation(AppMotion.reduced(AppMotion.gentle, reduceMotion)) { viewModel.setViewMode(next) }
            } label: {
                Image(next == .grid ? AppIcon.grid : AppIcon.list)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(AppColors.primary)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(.rect)
            }
            .accessibilityLabel(next == .grid ? Strings.exploreViewGrid : Strings.exploreViewList)
            .accessibilityIdentifier("explore.viewToggle")
        }
        .padding(.horizontal, AppSpacing.lg)
    }

    private var featuredRow: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Overline(Strings.exploreFeatured)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(spacing: AppSpacing.md) {
                    ForEach(viewModel.featured) { restaurant in
                        RestaurantCard(restaurant: restaurant, availability: viewModel.availability(restaurant)) {
                            router.push(.restaurant(restaurant.id))
                        }
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
        .transition(.opacity)
    }

    @ViewBuilder
    private func resultsList(_ results: [Restaurant]) -> some View {
        switch viewModel.viewMode {
        case .list:
            ForEach(Array(results.enumerated()), id: \.element.id) { index, restaurant in
                RestaurantListItem(restaurant: restaurant, availability: viewModel.availability(restaurant), testID: "explore.result.\(restaurant.id)") {
                    router.push(.restaurant(restaurant.id))
                }
                .padding(.horizontal, AppSpacing.lg)
                .reveal(index)
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        case .grid:
            LazyVGrid(columns: [GridItem(.flexible(), spacing: AppSpacing.md), GridItem(.flexible(), spacing: AppSpacing.md)], spacing: AppSpacing.lg) {
                ForEach(Array(results.enumerated()), id: \.element.id) { index, restaurant in
                    RestaurantGridItem(restaurant: restaurant, testID: "explore.result.\(restaurant.id)") {
                        router.push(.restaurant(restaurant.id))
                    }
                    .reveal(index)
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
                }
            }
            .padding(.horizontal, AppSpacing.lg)
        }
    }
}

#Preview {
    let session = MemberSession.preview()
    ExploreScreen(viewModel: ExploreViewModel(session: session))
        .environment(session)
        .environment(session.router)
}
