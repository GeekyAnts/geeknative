import SwiftUI

/// Help & support: contact rows and expandable FAQs.
struct HelpScreen: View {
    @State private var expanded: Set<FAQ> = []
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum FAQ: String, CaseIterable, Identifiable {
        case modify, cancel, demo

        var id: Self { self }

        var question: String {
            switch self {
            case .modify: Strings.helpFaqModifyQuestion
            case .cancel: Strings.helpFaqCancelQuestion
            case .demo: Strings.helpFaqDemoQuestion
            }
        }

        var answer: String {
            switch self {
            case .modify: Strings.helpFaqModifyAnswer
            case .cancel: Strings.helpFaqCancelAnswer
            case .demo: Strings.helpFaqDemoAnswer
            }
        }
    }

    static var emailURL: URL? { URL(string: "mailto:\(Strings.helpEmailAddress)") }
    static var phoneURL: URL? {
        URL(string: "tel:\(Strings.helpPhoneNumber.filter { !$0.isWhitespace })")
    }

    var body: some View {
        PushedScaffold(title: Strings.helpTitle) {
            ScreenHeader(title: Strings.helpTitle, subtitle: Strings.helpBody)
            RowsCard {
                ProfileRow(icon: AppIcon.mail, title: Strings.helpEmail, detail: Strings.helpEmailAddress) {
                    if let url = Self.emailURL { openURL(url) }
                }
                .accessibilityIdentifier("help.email")
                RowDivider()
                ProfileRow(icon: AppIcon.phone, title: Strings.helpCall, detail: Strings.helpPhoneNumber) {
                    if let url = Self.phoneURL { openURL(url) }
                }
                .accessibilityIdentifier("help.call")
            }
            .reveal(0)
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(Strings.helpFaqTitle)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onSurface)
                    .accessibilityAddTraits(.isHeader)
                RowsCard {
                    ForEach(Array(FAQ.allCases.enumerated()), id: \.element) { index, faq in
                        if index > 0 { RowDivider() }
                        faqItem(faq)
                    }
                }
            }
            .reveal(1)
        }
    }

    private func faqItem(_ faq: FAQ) -> some View {
        let isExpanded = expanded.contains(faq)
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) {
                    if isExpanded { expanded.remove(faq) } else { expanded.insert(faq) }
                }
            } label: {
                HStack(spacing: AppSpacing.md) {
                    Text(faq.question)
                        .font(AppTypography.subtitle)
                        .foregroundStyle(AppColors.onSurface)
                        .multilineTextAlignment(.leading)
                    Spacer(minLength: AppSpacing.sm)
                    Image(AppIcon.chevronDown)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.vertical, AppSpacing.md)
                .frame(minHeight: AppSize.touchTarget)
                .contentShape(.rect)
            }
            .buttonStyle(.pressable)
            .accessibilityAddTraits(isExpanded ? .isSelected : [])
            .accessibilityIdentifier("help.faq.\(faq.rawValue)")
            if isExpanded {
                Text(faq.answer)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, AppSpacing.lg)
                    .padding(.bottom, AppSpacing.lg)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .clipped()
    }
}

#Preview {
    NavigationStack {
        HelpScreen()
            .toolbar(.hidden, for: .navigationBar)
    }
}
