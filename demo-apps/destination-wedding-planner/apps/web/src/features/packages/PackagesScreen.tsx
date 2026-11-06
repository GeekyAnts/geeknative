import { useState } from 'react'
import { Photo } from '#/core/designsystem/Photo'
import { Page } from '#/core/designsystem/Page'
import { primaryClass } from '#/core/designsystem/Buttons'
import { GlassPanel } from '#/core/designsystem/GlassPanel'
import { experiences, packages } from '#/features/catalog/WeddingCatalog'
import { budgetBreakdown } from '#/features/catalog/filters'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { withToggledId } from '#/features/wedding/WeddingRepository'
import { useWeddingPlan } from '#/features/wedding/useWeddingPlan'
import { strings } from '#/generated/strings'

export function PackagesScreen() {
  const { plan, update } = useWeddingPlan()
  const [selectedId, setSelectedId] = useState(plan.packageId || 'intimate')
  const [guests, setGuests] = useState(String(plan.guestCount || 80))
  const [addons, setAddons] = useState<string[]>(plan.selectedExperienceIds)
  const guestCount = Math.min(500, Math.max(2, parsePositiveInt(guests) || 80))
  const selected = packages.find((item) => item.id === selectedId) ?? packages[0]
  const breakdown = budgetBreakdown(selected, guestCount, addons)

  async function choose() {
    await update({
      packageId: selected.id,
      guestCount,
      selectedExperienceIds: addons,
      budget: breakdown.total,
    })
  }

  return (
    <Page width="full" className="px-lg py-xl md:px-xxl">
      <header className="max-w-3xl">
        <h1 className="text-display">{strings.packagesTitle}</h1>
        <p className="mt-sm text-body text-on-surface-variant">{strings.packagesBody}</p>
      </header>
      <div data-testid="packages.list" className="grid gap-xl md:grid-cols-2">
        {packages.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`packages.card.${item.id}`}
            onClick={() => setSelectedId(item.id)}
            className={`overflow-hidden rounded-xl text-left shadow-high ${selectedId === item.id ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="h-48 overflow-hidden">
              <Photo src={item.imageUrl} alt={item.name} />
            </div>
            <div className="bg-surface p-lg">
              <h2 className="text-headline">{item.name}</h2>
              <p className="mt-sm text-body text-on-surface-variant">{item.description}</p>
              <p className="mt-md text-title text-primary">{formatAmount(item.basePrice)}</p>
            </div>
          </button>
        ))}
      </div>
      <GlassPanel className="grid gap-xl p-xl md:grid-cols-2">
        <div className="flex flex-col gap-lg">
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.packagesGuests}
            <input
              data-testid="packages.guests"
              inputMode="numeric"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              placeholder={strings.packagesGuests}
              className="min-h-touch-target rounded-md border border-outline bg-background px-md text-body placeholder:text-on-surface-variant"
            />
          </label>
          <fieldset>
            <legend className="text-caption text-on-surface-variant">{strings.packagesAddons}</legend>
            <div className="mt-sm flex flex-col gap-sm">
              {experiences.map((experience) => (
                <label key={experience.id} className="flex min-h-touch-target items-center gap-md">
                  <input
                    type="checkbox"
                    checked={addons.includes(experience.id)}
                    onChange={() => setAddons(withToggledId(addons, experience.id))}
                    className="size-4 accent-primary"
                  />
                  <span className="text-body">
                    {experience.name} · {formatAmount(experience.priceFrom)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div data-testid="packages.breakdown">
          <h2 className="text-headline">{strings.packagesBreakdown}</h2>
          <dl className="mt-md flex flex-col gap-sm text-body">
            <div className="flex justify-between">
              <dt>{strings.packagesLineVenue}</dt>
              <dd>{formatAmount(breakdown.venue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{strings.packagesLineAccommodation}</dt>
              <dd>{formatAmount(breakdown.accommodation)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{strings.packagesLineCatering}</dt>
              <dd>{formatAmount(breakdown.catering)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{strings.packagesLineDecoration}</dt>
              <dd>{formatAmount(breakdown.decoration)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{strings.packagesLinePhotography}</dt>
              <dd>{formatAmount(breakdown.photography)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{strings.packagesLineExperiences}</dt>
              <dd>{formatAmount(breakdown.experiences)}</dd>
            </div>
          </dl>
          <p data-testid="packages.total" className="mt-lg text-title">
            {strings.packagesTotal} {formatAmount(breakdown.total)}
          </p>
          <button type="button" data-testid="packages.selectCta" onClick={() => void choose()} className={`${primaryClass} mt-lg w-full`}>
            {plan.packageId === selected.id ? strings.packagesSelected : strings.packagesSelectCta}
          </button>
        </div>
      </GlassPanel>
    </Page>
  )
}
