import SwiftUI

/// A frosted, translucent warm-white surface for things that float (DESIGN.md: Glass surface):
/// `.ultraThinMaterial` under a `glass` tint, a `glassBorder` hairline and, when floating, the
/// `high` elevation shadow.
struct GlassSurface<S: InsettableShape>: ViewModifier {
    var shape: S
    var floating = false
    var strong = false

    func body(content: Content) -> some View {
        content
            .background {
                ZStack {
                    shape.fill(.ultraThinMaterial)
                    shape.fill(strong ? AppColors.glassStrong : AppColors.glass)
                }
            }
            .overlay {
                shape.strokeBorder(AppColors.glassBorder, lineWidth: AppSize.hairline)
            }
            .clipShape(shape)
            .shadow(floating ? AppElevation.high : AppShadow(color: .clear, radius: 0, y: 0))
    }
}

/// Warm ivory wash behind tab and form screens (DESIGN.md: Atmosphere).
struct ClubAtmosphere: View {
    var body: some View {
        ZStack {
            AppColors.background
            RadialGradient(
                colors: [AppColors.muted.opacity(0.45), .clear],
                center: UnitPoint(x: 0.0, y: 0.0),
                startRadius: 0,
                endRadius: 420
            )
            RadialGradient(
                colors: [AppColors.accent.opacity(0.14), .clear],
                center: UnitPoint(x: 1.0, y: 0.08),
                startRadius: 0,
                endRadius: 340
            )
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

extension View {
    func clubBackground() -> some View {
        background { ClubAtmosphere() }
    }

    func glassSurface(cornerRadius: CGFloat, floating: Bool = false, strong: Bool = false) -> some View {
        modifier(GlassSurface(shape: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous), floating: floating, strong: strong))
    }

    func glassCapsule(floating: Bool = false, strong: Bool = false) -> some View {
        modifier(GlassSurface(shape: Capsule(), floating: floating, strong: strong))
    }
}

/// A round icon-only button: `glassOnImage` on photographs, `glass` on content.
struct GlassIconButton: View {
    let icon: ImageResource
    let label: String
    var onImage = false
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(icon)
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(onImage ? AppColors.onGlassOnImage : AppColors.onSurface)
                .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                .background {
                    if onImage {
                        Circle().fill(AppColors.glassOnImage).background(.ultraThinMaterial, in: .circle)
                    } else {
                        Circle().fill(AppColors.glass).background(.ultraThinMaterial, in: .circle)
                            .overlay(Circle().strokeBorder(AppColors.glassBorder, lineWidth: AppSize.hairline))
                    }
                }
                .contentShape(.circle)
        }
        .buttonStyle(.pressable)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.4)
        .accessibilityLabel(label)
    }
}

/// The vertical gradient from transparent to `scrim` over the lower 60% of a photo with text.
struct PhotoScrim: View {
    var coversWholeImage = false

    var body: some View {
        LinearGradient(
            colors: [AppColors.scrim.opacity(0), AppColors.scrim],
            startPoint: UnitPoint(x: 0.5, y: coversWholeImage ? 0 : 0.4),
            endPoint: .bottom
        )
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
