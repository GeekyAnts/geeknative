import SwiftUI

/// Find products by name or category as you type (spec/features/search.md).
struct SearchScreen: View {
    @State private var viewModel: SearchViewModel
    @FocusState private var isFieldFocused: Bool

    init(viewModel: SearchViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    private let columns = [
        GridItem(.flexible(), spacing: AppSpacing.md, alignment: .top),
        GridItem(.flexible(), spacing: AppSpacing.md, alignment: .top),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                field
                content
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.top, AppSpacing.sm)
            .padding(.bottom, AppSpacing.xl)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(AppColors.background)
        .navigationTitle(Strings.searchTitle)
        .navigationBarTitleDisplayMode(.inline)
        .cartBar(onOpen: viewModel.openCart)
        .onAppear { isFieldFocused = true }
    }

    private var field: some View {
        HStack(spacing: AppSpacing.sm) {
            Image(AppIcon.search)
                .resizable()
                .scaledToFit()
                .frame(width: 20, height: 20)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .accessibilityHidden(true)
            TextField(
                "",
                text: $viewModel.query,
                prompt: Text(Strings.searchPlaceholder).foregroundStyle(AppColors.onSurfaceVariant)
            )
            .font(AppTypography.body)
            .foregroundStyle(AppColors.onSurface)
            .focused($isFieldFocused)
            .submitLabel(.search)
            .onSubmit { isFieldFocused = false }
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .accessibilityLabel(Strings.searchTitle)
            .accessibilityIdentifier("search.field")
            if !viewModel.query.isEmpty {
                Button(action: viewModel.clear) {
                    Image(AppIcon.clear)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .frame(width: 44, height: 44)
                        .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(Strings.searchClear)
                .accessibilityIdentifier("search.clear")
            }
        }
        .padding(.trailing, viewModel.query.isEmpty ? 0 : -AppSpacing.md)
        .fieldCapsule()
        .overlay(Capsule().strokeBorder(AppColors.primary, lineWidth: 1.5).opacity(isFieldFocused ? 1 : 0))
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.state {
        case .prompt:
            EmptyStateView(icon: AppIcon.search, title: Strings.searchPromptTitle, message: Strings.searchPromptBody)
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("search.prompt")
                .padding(.top, AppSpacing.xl)
        case .results(let products):
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                if let text = viewModel.resultCountText {
                    Text(text)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .accessibilityIdentifier("search.resultCount")
                }
                LazyVGrid(columns: columns, spacing: AppSpacing.md) {
                    ForEach(products) { product in
                        ProductCard(product: product, cart: viewModel.cart)
                    }
                }
            }
        case .noResults(let query):
            EmptyStateView(icon: AppIcon.noResults, title: Strings.searchNoResultsTitle(query: query), message: Strings.searchNoResultsBody)
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("search.empty")
                .padding(.top, AppSpacing.xl)
        }
    }
}

#Preview {
    let container = AppContainer.preview()
    NavigationStack {
        SearchScreen(viewModel: SearchViewModel(container: container))
    }
    .environment(container)
}
