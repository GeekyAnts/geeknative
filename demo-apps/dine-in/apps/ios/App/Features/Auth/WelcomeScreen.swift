import SwiftUI

/// The first impression: a full-bleed photograph with a slow Ken Burns zoom and a glass panel.
struct WelcomeScreen: View {
    /// spec/features/auth.md: scale 1 → 1.08 over 20 s, alternating.
    static let kenBurnsScale: CGFloat = 1.08
    static let kenBurnsDuration: Double = 20

    let onCreateAccount: () -> Void
    let onSignIn: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var imageURL: String?
    @State private var zoomed = false
    @State private var panelShown = false

    var body: some View {
        ZStack(alignment: .bottom) {
            AppColors.espresso.ignoresSafeArea()
            GeometryReader { proxy in
                if let imageURL {
                    RemoteImage(url: imageURL)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .scaleEffect(zoomed ? Self.kenBurnsScale : 1)
                        .opacity(0.6)
                        .clipped()
                }
            }
            .ignoresSafeArea()
            AppColors.espresso.opacity(0.5)
                .ignoresSafeArea()
                .allowsHitTesting(false)
            LinearGradient(
                colors: [AppColors.scrim, AppColors.scrim.opacity(0.8), AppColors.scrim.opacity(0)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 220)
            .frame(maxHeight: .infinity, alignment: .top)
            .ignoresSafeArea(edges: .top)
            .allowsHitTesting(false)
            PhotoScrim().ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text(AppIdentity.name)
                        .font(AppSerif.headline)
                        .foregroundStyle(AppColors.onGlassOnImage)
                    Overline(Strings.brandTagline, color: AppColors.onGlassOnImage)
                }
                .padding(.top, AppSpacing.lg)
                Spacer(minLength: AppSpacing.xl)
                panel
                    .opacity(panelShown || reduceMotion ? 1 : 0)
                    .offset(y: panelShown || reduceMotion ? 0 : AppSpacing.xl)
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.lg)
        }
        .task {
            imageURL = try? await container.catalogRepository.load().welcomeImage
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(AppMotion.decelerate(AppMotion.slow).delay(AppMotion.fast)) { panelShown = true }
            withAnimation(.easeInOut(duration: Self.kenBurnsDuration).repeatForever(autoreverses: true)) { zoomed = true }
        }
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Overline(Strings.welcomeOverline)
            GoldRule()
            Text(Strings.welcomeTitle)
                .font(AppSerif.hero)
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
            Text(Strings.welcomeBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .fixedSize(horizontal: false, vertical: true)
            VStack(spacing: AppSpacing.md) {
                PrimaryButton(title: Strings.welcomeCreateAccount, action: onCreateAccount)
                    .accessibilityIdentifier("welcome.createAccount")
                SecondaryButton(title: Strings.welcomeSignIn, action: onSignIn)
                    .accessibilityIdentifier("welcome.signIn")
            }
            .padding(.top, AppSpacing.xs)
        }
        .padding(AppSpacing.xl)
        .glassSurface(cornerRadius: AppRadius.xl, floating: true, strong: true)
    }
}

#Preview {
    WelcomeScreen(onCreateAccount: {}, onSignIn: {})
        .environment(AppContainer.preview(signedIn: false))
}
