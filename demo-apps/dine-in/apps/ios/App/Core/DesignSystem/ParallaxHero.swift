import Observation
import SwiftUI

/// The scroll offset of a screen, kept outside the screen's own state so that only the views that
/// read it (parallax photos, the top bar) redraw while scrolling.
@Observable
final class ScrollOffset {
    /// 0 at rest, negative when scrolled down, positive when pulled down.
    private(set) var value: CGFloat = 0
    @ObservationIgnored private var baseline: CGFloat?

    /// Takes the raw position of the top of the content; the first one is the resting position.
    func update(_ raw: CGFloat) {
        if baseline == nil { baseline = raw }
        let next = raw - (baseline ?? raw)
        if next != value { value = next }
    }
}

/// A photo that moves at half the scroll speed and stretches when pulled down (off with reduce
/// motion). Its frame is set by the caller; the photo overflows it slightly so no gap shows.
struct ParallaxPhoto: View {
    static let overflow: CGFloat = 0.2
    let url: String
    var label: String?
    let scroll: ScrollOffset
    let height: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let offset = reduceMotion ? 0 : scroll.value
        let extra = height * Self.overflow
        let pulled = max(0, offset)
        let shift = min(max(-offset / 2, 0), extra)
        RemoteImage(url: url, label: label)
            .frame(height: height + extra * 2)
            .offset(y: shift)
            .scaleEffect(1 + pulled / height, anchor: .bottom)
            .frame(height: height)
    }
}
