import SwiftUI

/// A category on Home: its emoji on its tint, with the name below (spec/features/catalog.md, Category tile).
struct CategoryTile: View {
    let category: Category
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: AppSpacing.sm) {
                ArtworkTile(emoji: category.emoji, categoryId: category.id, emojiSize: 48)
                    .aspectRatio(1, contentMode: .fit)
                Text(category.name)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onBackground)
                    .multilineTextAlignment(.center)
                    .lineLimit(2, reservesSpace: true)
                    .frame(maxWidth: .infinity)
            }
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(category.name)
        .accessibilityIdentifier("category.\(category.id)")
    }
}

#Preview {
    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: AppSpacing.md), count: 3), spacing: AppSpacing.lg) {
        ForEach(LocalCatalogRepository().categories()) { category in
            CategoryTile(category: category) {}
        }
    }
    .padding(AppSpacing.lg)
    .background(AppColors.background)
}
