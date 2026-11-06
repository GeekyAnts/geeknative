import SwiftUI

/// Date value as plain field text — not the compact DatePicker capsule — with a native calendar sheet.
struct AppDateField: View {
    let title: String
    @Binding var date: Date
    @Binding var hasDate: Bool
    var testID: String? = nil

    @State private var open = false

    init(
        title: String,
        date: Binding<Date>,
        hasDate: Binding<Bool> = .constant(true),
        testID: String? = nil
    ) {
        self.title = title
        self._date = date
        self._hasDate = hasDate
        self.testID = testID
    }

    var body: some View {
        Button {
            open = true
        } label: {
            Text(hasDate ? date.formatted(date: .abbreviated, time: .omitted) : title)
                .font(AppTypography.body)
                .foregroundStyle(hasDate ? AppColors.onBackground : AppColors.onSurfaceVariant)
                .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget, alignment: .leading)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(hasDate ? date.formatted(date: .abbreviated, time: .omitted) : "")
        .accessibilityIdentifier(testID ?? "app.dateField")
        .sheet(isPresented: $open) {
            NavigationStack {
                DatePicker(title, selection: $date, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .labelsHidden()
                    .tint(AppColors.primary)
                    .padding(AppSpacing.md)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .navigationTitle(title)
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button(Strings.commonDone) {
                                hasDate = true
                                open = false
                            }
                        }
                    }
            }
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
        }
    }
}
