import SwiftUI

/// Frosted panel over photography or ivory (DESIGN.md: Glass panel).
struct GlassPanel<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(AppSpacing.lg)
            .background {
                RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .background(
                        AppColors.surface.opacity(0.82),
                        in: RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous)
                    )
            }
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous)
                    .stroke(AppColors.outline)
            }
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
    }
}
