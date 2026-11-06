import SwiftUI

/// Text field whose prompt uses the token color at full opacity.
/// System TextField placeholders are dimmed again in dark mode and disappear on navy.
struct AppTextField: View {
    let prompt: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var axis: Axis = .horizontal
    var textContentType: UITextContentType?
    var autocapitalization: TextInputAutocapitalization = .sentences
    var disableAutocorrection = false
    var lineLimit: ClosedRange<Int>?

    var body: some View {
        ZStack(alignment: axis == .vertical ? .topLeading : .leading) {
            if text.isEmpty {
                Text(prompt)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .allowsHitTesting(false)
            }
            field
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onBackground)
                .keyboardType(keyboard)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled(disableAutocorrection)
                .textContentType(textContentType)
        }
        .accessibilityLabel(prompt)
    }

    @ViewBuilder
    private var field: some View {
        if axis == .vertical {
            TextField("", text: $text, axis: .vertical)
                .lineLimit(lineLimit ?? 3...6)
        } else {
            TextField("", text: $text)
        }
    }
}
