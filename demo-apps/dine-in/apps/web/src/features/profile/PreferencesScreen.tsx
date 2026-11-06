import type { ReactNode } from 'react'
import { Chip } from '#/core/designsystem/Chip'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { Page } from '#/core/designsystem/Page'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { Stepper } from '#/core/designsystem/Stepper'
import { TopBar } from '#/core/designsystem/TopBar'
import { cuisineIds, dietaryOptions, seatings } from '#/features/catalog/Catalog'
import { cuisineLabel, dietaryLabel, seatingIcon, seatingLabel } from '#/features/catalog/Labels'
import { orderedDietary } from '#/features/reservations/Reservation'
import { strings } from '#/generated/strings'
import { MAX_PREFERRED_PARTY_SIZE, MIN_PARTY_SIZE } from './DiningPreferences'
import { usePreferences } from './usePreferences'

const toggle = <T,>(values: T[], value: T) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

/** Dining preferences; every change saves at once. */
export function PreferencesScreen() {
  const { query, preferences, save } = usePreferences()

  return (
    <div className="min-h-dvh">
      <TopBar title={strings.preferencesTitle} fallback="/profile" />
      <Page width="form">
        <ScreenHeader title={strings.preferencesTitle} subtitle={strings.preferencesSubtitle} />
        {query.isPending && (
          <div className="flex flex-col gap-lg" aria-busy="true">
            <Skeleton className="h-list-image-height rounded-xl" />
            <Skeleton className="h-list-image-height rounded-xl" />
          </div>
        )}
        {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
        {preferences && (
          <>
            <Panel title={strings.preferencesCuisines}>
              {cuisineIds.map((cuisine) => (
                <Chip
                  key={cuisine}
                  testId={`preferences.cuisine.${cuisine}`}
                  selected={preferences.cuisines.includes(cuisine)}
                  onClick={() => void save({ ...preferences, cuisines: toggle(preferences.cuisines, cuisine) })}
                >
                  {cuisineLabel(cuisine)}
                </Chip>
              ))}
            </Panel>
            <Panel title={strings.preferencesDietary}>
              {dietaryOptions.map((dietary) => (
                <Chip
                  key={dietary}
                  testId={`preferences.dietary.${dietary}`}
                  selected={preferences.dietary.includes(dietary)}
                  onClick={() => void save({ ...preferences, dietary: orderedDietary(toggle(preferences.dietary, dietary)) })}
                >
                  {dietaryLabel(dietary)}
                </Chip>
              ))}
            </Panel>
            <Panel title={strings.preferencesSeating}>
              {seatings.map((seating) => (
                <Chip
                  key={seating}
                  testId={`preferences.seating.${seating}`}
                  icon={seatingIcon[seating]}
                  selected={preferences.seating === seating}
                  onClick={() => void save({ ...preferences, seating })}
                >
                  {seatingLabel(seating)}
                </Chip>
              ))}
            </Panel>
            <Panel title={strings.preferencesPartySize} wrap={false}>
              <Stepper
                value={preferences.partySize}
                min={MIN_PARTY_SIZE}
                max={MAX_PREFERRED_PARTY_SIZE}
                onChange={(partySize) => void save({ ...preferences, partySize })}
                text={strings.reserveGuestCount(preferences.partySize)}
                decreaseLabel={strings.reserveRemoveGuest}
                increaseLabel={strings.reserveAddGuest}
                decreaseTestId="preferences.partySize.decrease"
                increaseTestId="preferences.partySize.increase"
                countTestId="preferences.partySize.count"
              />
            </Panel>
          </>
        )}
      </Page>
    </div>
  )
}

function Panel({ title, wrap = true, children }: { title: string; wrap?: boolean; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-md rounded-xl p-lg motion-safe:animate-fade-up ${glassClass({ strong: true })}`}>
      <h2 className="text-overline uppercase tracking-(--spacing-tracking) text-accent">{title}</h2>
      {wrap ? <div className="flex flex-wrap gap-x-sm">{children}</div> : children}
    </section>
  )
}
