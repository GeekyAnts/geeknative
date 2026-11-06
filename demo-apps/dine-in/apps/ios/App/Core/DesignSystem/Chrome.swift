import SwiftUI

/// The five tabs (spec/navigation.md).
enum AppTab: String, CaseIterable, Identifiable {
    case discover, explore, reservations, saved, profile

    var id: Self { self }

    var label: String {
        switch self {
        case .discover: Strings.tabDiscover
        case .explore: Strings.tabExplore
        case .reservations: Strings.tabReservations
        case .saved: Strings.tabSaved
        case .profile: Strings.tabProfile
        }
    }

    var icon: ImageResource {
        switch self {
        case .discover: AppIcon.tabDiscover
        case .explore: AppIcon.tabExplore
        case .reservations: AppIcon.tabReservations
        case .saved: AppIcon.tabSaved
        case .profile: AppIcon.tabProfile
        }
    }
}

/// The floating glass tab bar. The active item's `espresso` pill moves with the snappy spring.
struct TabBar: View {
    /// DESIGN.md: at most 480 points wide, centred.
    static let maxWidth: CGFloat = 480
    @Binding var selection: AppTab
    @Namespace private var namespace
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases) { tab in
                let isSelected = tab == selection
                Button {
                    withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) { selection = tab }
                } label: {
                    VStack(spacing: AppSpacing.xxs) {
                        Image(tab.icon)
                            .renderingMode(.template).resizable().scaledToFit()
                            .frame(width: AppIconSize.md, height: AppIconSize.md)
                        Text(tab.label)
                            .font(AppTypography.caption)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    .foregroundStyle(isSelected ? AppColors.onEspresso : AppColors.onSurfaceVariant)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background {
                        if isSelected {
                            Capsule()
                                .fill(AppColors.espresso)
                                .matchedGeometryEffect(id: "tabPill", in: namespace)
                        }
                    }
                    .contentShape(.capsule)
                }
                .buttonStyle(.pressable)
                .accessibilityAddTraits(isSelected ? .isSelected : [])
            }
        }
        .padding(AppSpacing.xs)
        .frame(height: AppSize.tabBar)
        .glassCapsule(floating: true)
        .frame(maxWidth: Self.maxWidth)
        .padding(.horizontal, AppSpacing.lg)
        .padding(.bottom, AppSpacing.lg)
        .sensoryFeedback(.selection, trigger: selection)
    }
}

/// The bar on pushed screens: transparent over content with a glass back button; becomes a
/// `glassStrong` surface with a serif title once content scrolls under it.
struct TopBar<Trailing: View>: View {
    var title: String?
    var isScrolled = false
    /// Whether the content under the bar at rest is a photograph.
    var overImage = false
    var onBack: (() -> Void)?
    @ViewBuilder var trailing: Trailing
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: AppSpacing.md) {
            GlassIconButton(icon: AppIcon.back, label: Strings.commonBack, onImage: overImage && !isScrolled) {
                if let onBack { onBack() } else { dismiss() }
            }
            if isScrolled, let title {
                Text(title)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onSurface)
                    .lineLimit(1)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
            Spacer(minLength: 0)
            trailing
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.xs)
        .background(alignment: .top) {
            if isScrolled {
                ZStack(alignment: .bottom) {
                    Rectangle().fill(.ultraThinMaterial)
                    Rectangle().fill(AppColors.glassStrong)
                    Rectangle().fill(AppColors.glassBorder).frame(height: AppSize.hairline)
                }
                .ignoresSafeArea(edges: .top)
                .transition(.opacity)
            }
        }
        .animation(AppMotion.reduced(AppMotion.standard(AppMotion.normal), reduceMotion), value: isScrolled)
    }
}

extension TopBar where Trailing == EmptyView {
    init(title: String? = nil, isScrolled: Bool = false, overImage: Bool = false, onBack: (() -> Void)? = nil) {
        self.init(title: title, isScrolled: isScrolled, overImage: overImage, onBack: onBack) { EmptyView() }
    }
}

/// The bottom floating glass bar holding a primary action and optional summary text.
struct StickyActionBar<Summary: View, Action: View>: View {
    @ViewBuilder var summary: Summary
    @ViewBuilder var action: Action

    var body: some View {
        HStack(spacing: AppSpacing.md) {
            summary
                .frame(maxWidth: .infinity, alignment: .leading)
            action
                .fixedSize(horizontal: true, vertical: false)
        }
        .padding(AppSpacing.md)
        .padding(.leading, AppSpacing.sm)
        .glassSurface(cornerRadius: AppRadius.xl, floating: true)
        .padding(.horizontal, AppSpacing.lg)
        .padding(.bottom, AppSpacing.lg)
    }
}

/// The styled text field: `surface` fill, `outline` hairline, `primary` when focused, `error`
/// border and message when invalid, leading icon.
struct AppTextField: View {
    let icon: ImageResource
    let placeholder: String
    @Binding var text: String
    var error: String?
    var isSecure = false
    var contentType: UITextContentType?
    var keyboard: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .never
    let testID: String
    var hint: String?
    @FocusState private var focused: Bool
    @State private var revealed = false
    @Environment(\.isEnabled) private var isEnabled

    private var borderColor: Color {
        if error != nil { return AppColors.error }
        return focused ? AppColors.primary : AppColors.outline
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            HStack(spacing: AppSpacing.md) {
                Image(icon)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    .foregroundStyle(focused ? AppColors.primary : AppColors.onSurfaceVariant)
                Group {
                    if isSecure && !revealed {
                        SecureField(placeholder, text: $text)
                    } else {
                        TextField(placeholder, text: $text)
                    }
                }
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .textContentType(contentType)
                .keyboardType(keyboard)
                .textInputAutocapitalization(capitalization)
                .autocorrectionDisabled()
                .focused($focused)
                .accessibilityIdentifier(testID)
                if isSecure {
                    Button {
                        revealed.toggle()
                    } label: {
                        Image(revealed ? AppIcon.eyeOff : AppIcon.eye)
                            .renderingMode(.template).resizable().scaledToFit()
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                            .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                            .contentShape(.rect)
                    }
                    .accessibilityLabel(revealed ? Strings.authHidePassword : Strings.authShowPassword)
                    .accessibilityIdentifier("auth.togglePassword")
                }
            }
            .padding(.leading, AppSpacing.lg)
            .padding(.trailing, isSecure ? 0 : AppSpacing.lg)
            .frame(minHeight: AppSize.button)
            .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.md))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.md)
                    .strokeBorder(borderColor, lineWidth: focused || error != nil ? AppSize.hairline * 1.5 : AppSize.hairline)
            }
            .opacity(isEnabled ? 1 : 0.6)
            .contentShape(.rect)
            .onTapGesture { focused = true }
            if let error {
                Text(error)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.error)
                    .transition(.opacity)
            } else if let hint {
                Text(hint)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
        }
    }
}
