import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { primaryClass } from '#/core/designsystem/Buttons'
import { GlassPanel } from '#/core/designsystem/GlassPanel'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { destinations, experiences, heroImageUrl, packages } from '#/features/catalog/WeddingCatalog'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { useWeddingPlan } from '#/features/wedding/useWeddingPlan'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

export function HomeScreen() {
  const navigate = useNavigate()
  const { plan, update } = useWeddingPlan()
  const [location, setLocation] = useState(plan.searchLocation)
  const [date, setDate] = useState(plan.searchDate)
  const [guests, setGuests] = useState(plan.searchGuests ? String(plan.searchGuests) : '')
  const [budget, setBudget] = useState(plan.searchBudget ? String(plan.searchBudget) : '')

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    const guestCount = parsePositiveInt(guests)
    const budgetAmount = parsePositiveInt(budget)
    await update({
      searchLocation: location,
      searchDate: date,
      searchGuests: guestCount,
      searchBudget: budgetAmount,
      date: date || plan.date,
      guestCount: guestCount || plan.guestCount,
    })
    await navigate({
      to: '/destinations',
      search: { location, date, guests: guestCount || undefined, budget: budgetAmount || undefined },
    })
  }

  return (
    <Page width="full">
      <section className="relative min-h-svh overflow-hidden">
        <div className="absolute inset-0">
          <Photo src={heroImageUrl} alt={strings.homeHeroImageAlt} cinematic className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-on-inverse/55 via-on-inverse/42 to-on-inverse/82" />
        <div className="relative flex min-h-svh flex-col justify-end gap-xl px-lg pb-xxl pt-32 md:gap-xxl md:px-xxl md:pb-xxxl md:pt-[22vh]">
          <div className="max-w-3xl">
            <h1 className="text-hero text-balance text-inverse drop-shadow-[0_2px_16px_rgba(15,26,34,0.55)]">{strings.homeHeroTitle}</h1>
            <p className="mt-lg max-w-xl text-pretty text-body text-inverse drop-shadow-[0_1px_12px_rgba(15,26,34,0.5)]">{strings.homeHeroBody}</p>
            <div className="mt-xl flex flex-col gap-md sm:flex-row sm:flex-wrap">
              <Link
                to="/destinations"
                data-testid="home.exploreCta"
                className={`${primaryClass} dark:bg-on-inverse dark:text-inverse`}
              >
                {strings.homeExploreCta}
              </Link>
              <Link
                to="/wedding"
                data-testid="home.planCta"
                className="inline-flex min-h-touch-target items-center justify-center rounded-full border border-inverse px-xl text-label text-inverse motion-safe:transition motion-safe:duration-fast hover:bg-inverse/15"
              >
                {strings.homePlanCta}
              </Link>
            </div>
          </div>
          <GlassPanel testId="home.search" className="mx-auto w-full max-w-5xl p-lg">
            <form onSubmit={onSearch} className="grid gap-md md:grid-cols-5 md:items-end">
              <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
                {strings.homeSearchLocation}
                <span className="flex min-h-touch-target items-center gap-sm rounded-md border border-outline bg-background px-md">
                  <AppIcons.mapPin className="size-icon-sm text-primary" />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={strings.homeSearchLocationPlaceholder}
                    className="w-full bg-transparent text-body text-on-background outline-none placeholder:text-on-surface-variant"
                  />
                </span>
              </label>
              <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
                {strings.homeSearchDate}
                <span className="flex min-h-touch-target items-center gap-sm rounded-md border border-outline bg-background px-md">
                  <AppIcons.calendar className="size-icon-sm text-primary" />
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={`date-field w-full bg-transparent outline-none ${date ? 'text-on-background' : 'date-field-empty'}`}
                  />
                </span>
              </label>
              <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
                {strings.homeSearchGuests}
                <span className="flex min-h-touch-target items-center gap-sm rounded-md border border-outline bg-background px-md">
                  <AppIcons.users className="size-icon-sm text-primary" />
                  <input
                    inputMode="numeric"
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    placeholder={strings.homeSearchGuests}
                    className="w-full bg-transparent text-body text-on-background outline-none placeholder:text-on-surface-variant"
                  />
                </span>
              </label>
              <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
                {strings.homeSearchBudget}
                <span className="flex min-h-touch-target items-center gap-sm rounded-md border border-outline bg-background px-md">
                  <AppIcons.wallet className="size-icon-sm text-primary" />
                  <input
                    inputMode="numeric"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder={strings.homeSearchBudget}
                    className="w-full bg-transparent text-body text-on-background outline-none placeholder:text-on-surface-variant"
                  />
                </span>
              </label>
              <button type="submit" data-testid="home.search.submit" className={`${primaryClass} w-full`}>
                {strings.homeSearchSubmit}
              </button>
            </form>
          </GlassPanel>
        </div>
      </section>

      <section className="px-lg py-xxxl md:px-xxl" data-testid="home.featured">
        <p className="text-caption tracking-[0.28em] text-tertiary uppercase">{strings.homeFeaturedTitle}</p>
        <h2 className="mt-sm max-w-3xl text-display">{strings.homeFeaturedBody}</h2>
        <div className="mt-xxl flex flex-col gap-xxxl">
          {destinations.map((destination, index) => (
            <Link
              key={destination.id}
              to="/destinations/$id"
              params={{ id: destination.id }}
              data-testid={`home.destination.${destination.id}`}
              className={`group grid overflow-hidden rounded-xl bg-surface shadow-high md:grid-cols-2 ${index % 2 === 1 ? 'md:[&>:first-child]:order-2' : ''}`}
            >
              <div className="relative min-h-[18rem] overflow-hidden md:min-h-[26rem]">
                <Photo src={destination.imageUrl} alt={destination.name} className="h-full min-h-[18rem] md:min-h-[26rem]" />
                <div className="absolute inset-0 bg-on-inverse/20 motion-safe:transition motion-safe:duration-slow group-hover:bg-on-inverse/10" />
              </div>
              <div className="flex flex-col justify-center p-xl md:p-xxl">
                <p className="text-caption tracking-[0.22em] text-tertiary uppercase">{destination.region}</p>
                <h3 className="mt-sm text-headline">{destination.name}</h3>
                <p className="mt-xs text-title text-primary">{destination.tagline}</p>
                <p className="mt-md text-body text-on-surface-variant">{destination.description}</p>
                <span className="mt-xl inline-flex items-center gap-sm text-label text-primary">
                  {strings.homeExploreDestination}
                  <AppIcons.chevronRight className="size-icon-sm" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface-variant/60 px-lg py-xxxl md:px-xxl">
        <p className="text-caption tracking-[0.28em] text-tertiary uppercase">{strings.homeExperiencesTitle}</p>
        <h2 className="mt-sm max-w-2xl text-display">{strings.homeExperiencesBody}</h2>
        <div className="mt-xxl grid gap-lg md:grid-cols-3">
          {experiences.slice(0, 6).map((experience) => (
            <Link key={experience.id} to="/experiences" className="group overflow-hidden rounded-lg bg-surface shadow-low">
              <div className="h-48 overflow-hidden">
                <Photo src={experience.imageUrl} alt={experience.name} />
              </div>
              <div className="p-lg">
                <h3 className="text-title">{experience.name}</h3>
                <p className="mt-sm text-body text-on-surface-variant">{experience.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-lg py-xxxl md:px-xxl">
        <p className="text-caption tracking-[0.28em] text-tertiary uppercase">{strings.homePackagesTitle}</p>
        <h2 className="mt-sm max-w-2xl text-display">{strings.homePackagesBody}</h2>
        <div className="mt-xxl grid gap-lg md:grid-cols-2">
          {packages.map((item) => (
            <Link key={item.id} to="/packages" className="relative overflow-hidden rounded-xl shadow-high">
              <div className="h-72">
                <Photo src={item.imageUrl} alt={item.name} />
              </div>
              <GlassPanel className="absolute inset-x-lg bottom-lg p-lg">
                <h3 className="text-title">{item.name}</h3>
                <p className="mt-xs text-body text-on-surface-variant">{formatAmount(item.basePrice)}</p>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </section>
    </Page>
  )
}
