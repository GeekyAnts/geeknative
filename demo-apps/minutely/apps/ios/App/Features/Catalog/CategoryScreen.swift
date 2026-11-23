import SwiftUI

/// One category's products, with chips to switch category (spec/features/catalog.md, Category).
struct CategoryScreen: View {
    @State private var viewModel: CategoryViewModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: CategoryViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    private let columns = [
        GridItem(.flexible(), spacing: AppSpacing.md, alignment: .top),
        GridItem(.flexible(), spacing: AppSpacing.md, alignment: .top),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                chips
                LazyVGrid(columns: columns, spacing: AppSpacing.md) {
                    ForEach(viewModel.products) { product in
                        ProductCard(product: product, cart: viewModel.cart)
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .id(viewModel.selectedCategoryId)
                .transition(.opacity)
            }
            .padding(.top, AppSpacing.sm)
            .padding(.bottom, AppSpacing.xl)
        }
        .background(AppColors.background)
        .navigationTitle(viewModel.title)
        .navigationBarTitleDisplayMode(.inline)
        .cartBar(onOpen: viewModel.openCart)
    }

    private var chips: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(viewModel.categories) { category in
                        chip(category)
                            .id(category.id)
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.vertical, AppSpacing.xs)
            }
            .onAppear { proxy.scrollTo(viewModel.selectedCategoryId, anchor: .center) }
            .onChange(of: viewModel.selectedCategoryId) { _, id in
                withAnimation(Motion.ease(reduceMotion: reduceMotion)) { proxy.scrollTo(id, anchor: .center) }
            }
        }
    }

    private func chip(_ category: Category) -> some View {
        let isSelected = category.id == viewModel.selectedCategoryId
        return Button {
            withAnimation(Motion.ease(reduceMotion: reduceMotion)) { viewModel.select(category.id) }
        } label: {
            HStack(spacing: AppSpacing.xs) {
                Text(category.emoji)
                    .accessibilityHidden(true)
                Text(category.name)
                    .font(AppTypography.label)
                    .fontWeight(isSelected ? .bold : .medium)
            }
            .foregroundStyle(isSelected ? AppColors.onPrimary : AppColors.onSurface)
            .padding(.horizontal, AppSpacing.md)
            .frame(minHeight: 40)
            .background(isSelected ? AppColors.primary : AppColors.surface, in: .capsule)
            .overlay(Capsule().strokeBorder(isSelected ? .clear : AppColors.outline, lineWidth: 1))
            .contentShape(.capsule)
        }
        .buttonStyle(.pressable)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .accessibilityIdentifier("category.chip.\(category.id)")
    }
}

#Preview {
    let container = AppContainer.preview(cart: [CartLine(productId: "banana", quantity: 2)])
    NavigationStack {
        CategoryScreen(viewModel: CategoryViewModel(categoryId: "fruits", container: container))
    }
    .environment(container)
}
