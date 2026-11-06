import SwiftUI

struct ExperiencesScreen: View {
    @Environment(AppContainer.self) private var container
    @State private var activeExperienceId: String?
    @State private var showingEnquiry = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                Text(Strings.experiencesBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    ForEach(WeddingCatalog.experiences) { experience in
                        card(experience)
                    }
                }
                .testIdentifier(testId: "experiences.list")
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.experiencesTitle)
        .sheet(isPresented: $showingEnquiry) {
            EnquireSheet(
                title: Strings.experiencesEnquireTitle,
                successMessage: Strings.experiencesEnquireSuccess,
                formTestID: "experiences.enquireForm",
                submitTestID: "experiences.enquireSubmit",
                successTestID: "experiences.enquireSuccess",
                onSubmit: send
            )
        }
    }

    private func card(_ experience: Experience) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            CatalogPhoto(urlString: experience.imageUrl)
                .frame(height: 180)
                .frame(maxWidth: .infinity)
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack(spacing: AppSpacing.sm) {
                    Image(experience.appIcon)
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.primary)
                    Text(experience.name)
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.onSurface)
                }
                Text(experience.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(Strings.experiencesPriceFrom(amount: CatalogFormat.amount(experience.priceFrom)))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurface)
                Button {
                    activeExperienceId = experience.id
                    showingEnquiry = true
                } label: {
                    HStack(spacing: AppSpacing.sm) {
                        Image(AppIcon.send)
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        Text(Strings.experiencesEnquireCta)
                    }
                }
                .buttonStyle(.secondary)
                .accessibilityIdentifier("experiences.enquireCta.\(experience.id)")
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.xl))
        .shadow(AppElevation.high)
        .accessibilityIdentifier("experiences.card.\(experience.id)")
    }

    private func send(_ draft: EnquiryDraft) {
        guard let activeExperienceId else { return }
        container.weddingRepository.addEnquiry(
            Enquiry(
                id: UUID().uuidString,
                venueId: "",
                experienceId: activeExperienceId,
                coupleName: draft.coupleName,
                email: draft.email,
                date: draft.isoDate,
                guests: CatalogFormat.parsePositiveInt(draft.guests),
                message: draft.message,
                createdAt: ISO8601DateFormatter().string(from: Date())
            )
        )
        var ids = container.weddingRepository.plan.selectedExperienceIds
        if !ids.contains(activeExperienceId) {
            ids.append(activeExperienceId)
        }
        container.weddingRepository.update(WeddingPlanPatch(selectedExperienceIds: ids))
    }
}

#Preview {
    NavigationStack {
        ExperiencesScreen()
    }
    .environment(AppContainer.preview())
}
