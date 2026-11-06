import SwiftUI

/// Remote catalog photography. A missing image falls back to `surfaceVariant`.
struct CatalogPhoto: View {
    let urlString: String
    var cinematic: Bool = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    private var isUITesting: Bool { UITestFlags.isRunning }

    var body: some View {
        AppColors.surfaceVariant
            .overlay {
                if isUITesting {
                    AppColors.surfaceVariant
                } else {
                    AsyncImage(url: URL(string: urlString)) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .scaleEffect(appeared && cinematic ? 1.08 : 1)
                        default:
                            AppColors.surfaceVariant
                        }
                    }
                }
            }
            .clipped()
            .onAppear {
                guard !isUITesting else { return }
                withAnimation(AppMotion.reduced(AppMotion.standard(cinematic ? AppMotion.cinematic : AppMotion.slow), reduceMotion)) {
                    appeared = true
                }
            }
    }
}
