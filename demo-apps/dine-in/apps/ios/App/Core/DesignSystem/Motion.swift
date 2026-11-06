import SwiftUI

/// Cards and buttons scale to 0.97 while pressed, with the snappy spring (DESIGN.md: Motion).
struct PressableButtonStyle: ButtonStyle {
    static let pressedScale: CGFloat = 0.97
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? Self.pressedScale : 1)
            .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: configuration.isPressed)
            .contentShape(.rect)
    }
}

extension ButtonStyle where Self == PressableButtonStyle {
    static var pressable: PressableButtonStyle { PressableButtonStyle() }
}

/// Fades content in while sliding it up by `spacing.xl`, staggered by `duration.fast / 3` per item
/// (at most 6 items). Off with reduce motion.
private struct RevealModifier: ViewModifier {
    static let maxStaggered = 6
    let index: Int
    let onScroll: Bool
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .opacity(shown || reduceMotion ? 1 : 0)
            .offset(y: shown || reduceMotion ? 0 : AppSpacing.xl)
            .modifier(VisibilityTrigger(onScroll: onScroll) { reveal() })
    }

    private func reveal() {
        guard !shown else { return }
        let delay = Double(min(index, Self.maxStaggered - 1)) * AppMotion.fast / 3
        withAnimation(AppMotion.reduced(AppMotion.decelerate(AppMotion.normal).delay(delay), reduceMotion)) {
            shown = true
        }
    }
}

private struct ScrolledTracker: ViewModifier {
    @Binding var isScrolled: Bool
    let threshold: CGFloat
    @State private var baseline: CGFloat?

    func body(content: Content) -> some View {
        content.onScrollOffsetChange { raw in
            if baseline == nil { baseline = raw }
            let scrolled = raw - (baseline ?? raw) < -threshold
            if scrolled != isScrolled { isScrolled = scrolled }
        }
    }
}

/// Calls `action` when the view first scrolls into view (iOS 18), or when it appears.
private struct VisibilityTrigger: ViewModifier {
    let onScroll: Bool
    let action: () -> Void

    func body(content: Content) -> some View {
        if onScroll, #available(iOS 18.0, *) {
            content.onScrollVisibilityChange(threshold: 0.05) { visible in
                if visible { action() }
            }
        } else {
            content.onAppear(perform: action)
        }
    }
}

extension View {
    /// Fades and slides the view in when it appears (or first scrolls into view with `onScroll`).
    func reveal(_ index: Int = 0, onScroll: Bool = false) -> some View {
        modifier(RevealModifier(index: index, onScroll: onScroll))
    }

    /// Sets `isScrolled` once the content has scrolled more than `threshold` from where it rests.
    /// Put it on the first view of the scroll content.
    func trackScrolled(_ isScrolled: Binding<Bool>, threshold: CGFloat = AppSpacing.xl) -> some View {
        modifier(ScrolledTracker(isScrolled: isScrolled, threshold: threshold))
    }

    /// Reports the vertical scroll offset of the enclosing ScrollView (0 at rest, negative when
    /// scrolled down, positive when pulled down). Put it on the first view of the scroll content.
    func onScrollOffsetChange(_ action: @escaping (CGFloat) -> Void) -> some View {
        onGeometryChange(for: CGFloat.self) { proxy in
            proxy.frame(in: .scrollView).minY
        } action: { value in
            action(value)
        }
    }
}
