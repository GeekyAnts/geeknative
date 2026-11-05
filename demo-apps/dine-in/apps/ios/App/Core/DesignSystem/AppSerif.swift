import CoreText
import SwiftUI

/// Serif text styles in Cormorant Garamond (DESIGN.md: Type roles), with the sizes of the matching
/// typography tokens. They scale with Dynamic Type like `AppTypography`.
nonisolated enum AppSerif {
    enum Role {
        case hero, display, headline, title

        var size: CGFloat {
            switch self {
            case .hero: AppTextSize.hero
            case .display: AppTextSize.display
            case .headline: AppTextSize.headline
            case .title: AppTextSize.title
            }
        }

        /// The Dynamic Type style of the matching `AppTypography` token.
        var textStyle: Font.TextStyle {
            switch self {
            case .hero, .display: .largeTitle
            case .headline: .title
            case .title: .title2
            }
        }
    }

    static let semiBold = "CormorantGaramond-SemiBold"
    static let medium = "CormorantGaramond-Medium"
    static let mediumItalic = "CormorantGaramond-MediumItalic"

    static let hero = font(.hero)
    static let display = font(.display)
    static let headline = font(.headline)
    static let title = font(.title)

    /// The italic accent, used at most once per screen for an emphasised phrase.
    static func italic(_ role: Role) -> Font {
        .custom(mediumItalic, size: role.size, relativeTo: role.textStyle)
    }

    private static func font(_ role: Role) -> Font {
        .custom(semiBold, size: role.size, relativeTo: role.textStyle)
    }

    /// The bundled display-face files (copied from contracts/fonts/display by `make assets`).
    static let files = ["CormorantGaramond-SemiBold.ttf", "CormorantGaramond-Medium.ttf", "CormorantGaramond-MediumItalic.ttf"]

    /// Registers the display face for this process. AppMain calls it at launch.
    static func register() {
        for file in files {
            let url = Bundle.main.url(forResource: file, withExtension: nil)
                ?? Bundle.main.url(forResource: file, withExtension: nil, subdirectory: "Fonts")
            guard let url else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}
