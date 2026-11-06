import SwiftUI

struct EnquiryDraft {
    var coupleName = ""
    var email = ""
    var date = Date()
    var hasDate = false
    var guests = ""
    var message = ""

    var isValid: Bool {
        !coupleName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && email.contains("@")
            && !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var isoDate: String {
        hasDate ? ISODate.string(from: date) : ""
    }
}

/// Shared enquiry sheet for venues and experiences.
struct EnquireSheet: View {
    let title: String
    let successMessage: String
    let formTestID: String
    let submitTestID: String
    let successTestID: String
    let onSubmit: (EnquiryDraft) -> Void

    @State private var draft = EnquiryDraft()
    @State private var error = false
    @State private var success = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if success {
                    VStack(alignment: .leading, spacing: AppSpacing.lg) {
                        Text(successMessage)
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurface)
                            .accessibilityIdentifier(successTestID)
                        Button(Strings.commonClose) { dismiss() }
                            .buttonStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(AppSpacing.xl)
                } else {
                    form
                }
            }
            .background(AppColors.background)
            .navigationTitle(title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(Strings.commonCancel) { dismiss() }
                }
            }
        }
    }

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                labeledField(Strings.venuesEnquireName) {
                    AppTextField(
                        prompt: Strings.venuesEnquireName,
                        text: $draft.coupleName,
                        textContentType: .name
                    )
                    .frame(minHeight: AppSize.touchTarget)
                }
                labeledField(Strings.venuesEnquireEmail) {
                    AppTextField(
                        prompt: Strings.venuesEnquireEmail,
                        text: $draft.email,
                        keyboard: .emailAddress,
                        textContentType: .emailAddress,
                        autocapitalization: .never,
                        disableAutocorrection: true
                    )
                    .frame(minHeight: AppSize.touchTarget)
                }
                labeledField(Strings.venuesEnquireDate) {
                    AppDateField(
                        title: Strings.venuesEnquireDate,
                        date: $draft.date,
                        hasDate: $draft.hasDate
                    )
                }
                labeledField(Strings.venuesEnquireGuests) {
                    AppTextField(
                        prompt: Strings.venuesEnquireGuests,
                        text: $draft.guests,
                        keyboard: .numberPad
                    )
                    .frame(minHeight: AppSize.touchTarget)
                }
                labeledField(Strings.venuesEnquireMessage) {
                    AppTextField(
                        prompt: Strings.venuesEnquireMessage,
                        text: $draft.message,
                        axis: .vertical,
                        lineLimit: 3...6
                    )
                    .frame(minHeight: AppSize.touchTarget, alignment: .top)
                }
                if error {
                    Text(Strings.venuesEnquireError)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.error)
                }
                Button(Strings.venuesEnquireSubmit) {
                    submit()
                }
                .buttonStyle(.primary)
                .accessibilityIdentifier(submitTestID)
            }
            .padding(AppSpacing.lg)
            .testIdentifier(testId: formTestID)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func labeledField<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            content()
                .padding(.horizontal, AppSpacing.md)
                .background(AppColors.background, in: .rect(cornerRadius: AppRadius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .stroke(AppColors.outline)
                }
        }
    }

    private func submit() {
        guard draft.isValid else {
            error = true
            return
        }
        error = false
        onSubmit(draft)
        success = true
    }
}
