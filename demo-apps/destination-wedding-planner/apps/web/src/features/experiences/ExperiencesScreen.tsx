import { useState } from 'react'
import { EnquireDialog, type EnquiryDraft } from '#/core/designsystem/EnquireDialog'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { secondaryClass } from '#/core/designsystem/Buttons'
import { experiences } from '#/features/catalog/WeddingCatalog'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { useWeddingPlan } from '#/features/wedding/useWeddingPlan'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

export function ExperiencesScreen() {
  const { plan, update, addEnquiry } = useWeddingPlan()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function send(draft: EnquiryDraft) {
    if (!activeId) return
    await addEnquiry({
      id: `${Date.now()}`,
      venueId: '',
      experienceId: activeId,
      coupleName: draft.coupleName,
      email: draft.email,
      date: draft.date,
      guests: parsePositiveInt(draft.guests),
      message: draft.message,
      createdAt: new Date().toISOString(),
    })
    const ids = plan.selectedExperienceIds.includes(activeId) ? plan.selectedExperienceIds : [...plan.selectedExperienceIds, activeId]
    await update({ selectedExperienceIds: ids })
    setSuccess(true)
  }

  return (
    <Page width="full" className="px-lg py-xl md:px-xxl">
      <header className="max-w-3xl">
        <h1 className="text-display">{strings.experiencesTitle}</h1>
        <p className="mt-sm text-body text-on-surface-variant">{strings.experiencesBody}</p>
      </header>
      <div data-testid="experiences.list" className="grid gap-xl md:grid-cols-2">
        {experiences.map((experience) => (
          <article key={experience.id} data-testid={`experiences.card.${experience.id}`} className="overflow-hidden rounded-xl bg-surface shadow-high">
            <div className="h-56 overflow-hidden">
              <Photo src={experience.imageUrl} alt={experience.name} />
            </div>
            <div className="p-lg">
              <h2 className="text-headline">{experience.name}</h2>
              <p className="mt-sm text-body text-on-surface-variant">{experience.description}</p>
              <p className="mt-md text-label">{strings.experiencesPriceFrom({ amount: formatAmount(experience.priceFrom) })}</p>
              <button
                type="button"
                data-testid={`experiences.enquireCta.${experience.id}`}
                onClick={() => {
                  setSuccess(false)
                  setActiveId(experience.id)
                }}
                className={`${secondaryClass} mt-lg`}
              >
                <AppIcons.send className="size-icon-sm" />
                {strings.experiencesEnquireCta}
              </button>
            </div>
          </article>
        ))}
      </div>
      <EnquireDialog
        title={strings.experiencesEnquireTitle}
        successMessage={strings.experiencesEnquireSuccess}
        open={activeId !== null}
        success={success}
        onClose={() => setActiveId(null)}
        onSubmit={(draft) => void send(draft)}
        testId="experiences.enquireForm"
        submitTestId="experiences.enquireSubmit"
        successTestId="experiences.enquireSuccess"
      />
    </Page>
  )
}
