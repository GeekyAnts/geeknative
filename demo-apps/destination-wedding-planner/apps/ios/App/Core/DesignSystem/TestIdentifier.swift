import SwiftUI

extension View {
    /// Sets a spec test ID while keeping child elements independently discoverable.
    func testIdentifier(testId: String) -> some View {
        accessibilityElement(children: .contain)
            .accessibilityIdentifier(testId)
    }
}
