import SwiftUI

/// A card for grouped content on a screen (DESIGN.md: Card).
struct AppCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.lg)
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
    }
}
