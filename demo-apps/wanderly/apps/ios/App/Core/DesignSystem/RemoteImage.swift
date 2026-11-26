import Foundation
import SwiftUI
import UIKit

/// Loads a catalog photograph: placeholder → image (fade) → fallback URL → surfaceVariant block.
struct RemoteImage: View {
    let urlString: String
    let fallbackURLString: String
    let accessibilityName: String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var image: UIImage?

    var body: some View {
        ZStack {
            AppColors.surfaceVariant
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .opacity(1)
            }
        }
        .clipped()
        .accessibilityLabel(accessibilityName)
        .task(id: urlString) {
            if ProcessInfo.processInfo.arguments.contains("--uitesting") {
                return
            }
            await load()
        }
    }

    private func load() async {
        image = nil
        if let loaded = await fetch(urlString) {
            await present(loaded)
            return
        }
        if !fallbackURLString.isEmpty, fallbackURLString != urlString, let loaded = await fetch(fallbackURLString) {
            await present(loaded)
        }
    }

    private func present(_ loaded: UIImage) async {
        if reduceMotion {
            image = loaded
        } else {
            withAnimation(AppMotion.standard(AppMotion.normal)) {
                image = loaded
            }
        }
    }

    private func fetch(_ raw: String) async -> UIImage? {
        guard let url = URL(string: raw) else { return nil }
        do {
            var request = URLRequest(url: url)
            request.cachePolicy = .returnCacheDataElseLoad
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                return nil
            }
            return UIImage(data: data)
        } catch {
            return nil
        }
    }
}

/// Bottom-to-top overlay scrim so titles on photographs stay readable.
struct PhotoScrim: View {
    var body: some View {
        LinearGradient(
            colors: [.clear, AppColors.overlay],
            startPoint: .center,
            endPoint: .bottom
        )
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
