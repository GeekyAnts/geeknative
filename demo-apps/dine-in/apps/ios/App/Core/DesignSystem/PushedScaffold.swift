import SwiftUI

/// A pushed screen: scrolling content under a `TopBar` that turns to glass (with the title) once scrolled.
struct PushedScaffold<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content
    @State private var isScrolled = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    content
                }
                .trackScrolled($isScrolled)
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSize.touchTarget + AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxxl)
            }
            .scrollIndicators(.hidden)
            TopBar(title: title, isScrolled: isScrolled)
        }
        .background(AppColors.background.ignoresSafeArea())
        .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: isScrolled)
    }
}

/// A `surface` card holding rows; put a `RowDivider` between them.
struct RowsCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) {
            content
        }
        .background(AppColors.surface)
        .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
    }
}

struct RowDivider: View {
    var body: some View {
        Rectangle().fill(AppColors.outline).frame(height: AppSize.hairline)
            .padding(.leading, AppSpacing.lg)
            .accessibilityHidden(true)
    }
}
