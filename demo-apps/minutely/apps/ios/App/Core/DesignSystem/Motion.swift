import SwiftUI

/// Quick, physical motion (DESIGN.md, Direction). Nothing runs longer than 300 ms,
/// and with Reduce Motion on, springs and slides become short fades.
enum Motion {
    /// Springs: the stepper, the cart bar, the order check.
    static func spring(reduceMotion: Bool) -> Animation {
        reduceMotion ? .easeInOut(duration: 0.15) : .spring(duration: 0.3, bounce: 0.3)
    }

    /// Plain changes, such as a progress bar filling.
    static func ease(reduceMotion: Bool) -> Animation {
        reduceMotion ? .linear(duration: 0.01) : .easeOut(duration: 0.25)
    }
}

/// Shrinks a little while pressed, for custom tappable cards and tiles.
struct PressableButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.96 : 1)
            .opacity(configuration.isPressed && reduceMotion ? 0.7 : 1)
            .animation(Motion.spring(reduceMotion: reduceMotion), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PressableButtonStyle {
    static var pressable: PressableButtonStyle { PressableButtonStyle() }
}
