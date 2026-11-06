import type { ReactNode } from 'react'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { focusRing, textButtonClass } from '#/core/designsystem/Buttons'
import { Chip } from '#/core/designsystem/Chip'
import { DemoNote } from '#/core/designsystem/DemoNote'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { Page } from '#/core/designsystem/Page'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { StickyActionBar } from '#/core/designsystem/StickyActionBar'
import { Stepper } from '#/core/designsystem/Stepper'
import { TopBar } from '#/core/designsystem/TopBar'
import { dietaryOptions, occasions, type Restaurant } from '#/features/catalog/Catalog'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { Formatters } from '#/features/catalog/Formatters'
import { parseIsoDate } from '#/features/catalog/LocalDate'
import { dietaryLabel, occasionIcon, occasionLabel, seatingIcon, seatingLabel } from '#/features/catalog/Labels'
import type { ReservationDraft } from '#/features/reservations/Reservation'
import { MAX_NOTES_LENGTH, reservationErrorMessage } from '#/features/reservations/ReservationValidator'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { MIN_GUESTS, dietarySummary, reserveSteps, type ReserveStep } from './ReserveLogic'
import { useReserveViewModel, type ReserveViewModel } from './useReserveViewModel'

const stepLabel: Record<ReserveStep, string> = {
  details: strings.reserveStepDetails,
  preferences: strings.reserveStepPreferences,
  review: strings.reserveStepReview,
}

/** `reserve.time.<HH:mm>`, colon kept (spec/features/reservation.md). */
const timeTestId = (time: string) => `reserve.time.${time}`

const panelClass = `flex flex-col gap-md rounded-xl p-lg ${glassClass({ strong: true })}`

export function ReserveScreen({ restaurantId, reservationId }: { restaurantId: string; reservationId?: string }) {
  const viewModel = useReserveViewModel(restaurantId, reservationId)
  const { restaurant, draft } = viewModel

  if (viewModel.status !== 'ready' || !restaurant || !draft) {
    return (
      <div className="min-h-dvh">
        <TopBar fallback={`/restaurants/${restaurantId}`} />
        <Page width="form">
          {viewModel.status === 'loading' && (
            <div className="flex flex-col gap-lg" aria-busy="true">
              <Skeleton className="h-xxl w-2/3 rounded-sm" />
              <Skeleton className="h-list-image-height rounded-xl" />
              <Skeleton className="h-list-image-height rounded-xl" />
            </div>
          )}
          {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
          {viewModel.status === 'notFound' && (
            <EmptyState icon={AppIcons.utensils} title={strings.restaurantNotFoundTitle} body={strings.restaurantNotFoundBody} testId="restaurant.notFound" />
          )}
          {viewModel.status === 'reservationNotFound' && (
            <EmptyState icon={AppIcons.calendar} title={strings.reservationNotFoundTitle} body={strings.reservationNotFoundBody} testId="reservation.notFound" />
          )}
        </Page>
      </div>
    )
  }

  const action = viewModel.step === 'review' ? (viewModel.modifying ? strings.reserveSaveChanges : strings.reserveConfirm) : strings.commonContinue

  return (
    <div className="relative isolate min-h-dvh pb-action-bar">
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-espresso">
        <RemoteImage src={restaurant.heroImage} alt="" className="size-full scale-110 blur-xl" />
        <div className="absolute inset-0 bg-scrim" />
      </div>
      <TopBar onImage title={restaurant.name} fallback={`/restaurants/${restaurant.id}`} />
      <Page width="form" className="pt-md">
        <header className="flex flex-col gap-xs motion-safe:animate-fade-up">
          <p data-testid="reserve.title" className="text-overline uppercase tracking-(--spacing-tracking) text-accent">
            {viewModel.modifying ? strings.reserveModifyTitle : strings.reserveTitle}
          </p>
          <AppSerif role="headline" as="h1" className="text-on-glass-on-image">
            {restaurant.name}
          </AppSerif>
        </header>
        <Progress viewModel={viewModel} />
        <div
          key={viewModel.step}
          className={`flex flex-col gap-lg ${viewModel.direction === 'forward' ? 'motion-safe:animate-slide-from-end' : 'motion-safe:animate-slide-from-start'}`}
        >
          {viewModel.step === 'details' && <DetailsStep viewModel={viewModel} restaurant={restaurant} draft={draft} />}
          {viewModel.step === 'preferences' && <PreferencesStep viewModel={viewModel} restaurant={restaurant} draft={draft} />}
          {viewModel.step === 'review' && <ReviewStep viewModel={viewModel} restaurant={restaurant} draft={draft} />}
        </div>
      </Page>
      <StickyActionBar
        notice={
          viewModel.error && (
            <p data-testid="reserve.error" role="alert" className="flex items-start gap-sm rounded-md bg-error px-md py-sm text-label text-on-error motion-safe:animate-fade-in">
              <AppIcons.alert className="mt-xxs size-icon-sm shrink-0" />
              {reservationErrorMessage(viewModel.error)}
            </p>
          )
        }
        summary={
          draft.time && (
            <>
              <p className="truncate text-label text-on-surface">{Formatters.separator(Formatters.dateShort(draft.date), Formatters.time(draft.time))}</p>
              <p className="truncate text-caption text-on-surface-variant">{strings.reserveGuestCount(draft.partySize)}</p>
            </>
          )
        }
      >
        <PrimaryButton
          testId={viewModel.step === 'review' ? 'reserve.confirm' : 'reserve.continue'}
          busy={viewModel.busy}
          onClick={viewModel.next}
          className={draft.time ? '' : 'flex-1'}
          aria-disabled={viewModel.step === 'details' && !draft.time}
        >
          {action}
        </PrimaryButton>
      </StickyActionBar>
    </div>
  )
}

function Progress({ viewModel }: { viewModel: ReserveViewModel }) {
  const total = reserveSteps.length
  return (
    <nav aria-label={strings.reserveStepPosition({ index: viewModel.stepIndex + 1, total })} className="flex flex-col gap-sm">
      <div
        data-testid="reserve.progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={viewModel.stepIndex + 1}
        aria-valuetext={strings.reserveStepPosition({ index: viewModel.stepIndex + 1, total })}
        className="h-xs overflow-hidden rounded-full bg-on-glass-on-image/20"
      >
        <div
          className="h-full origin-left rounded-full bg-accent motion-safe:transition-transform motion-safe:duration-gentle motion-safe:ease-gentle rtl:origin-right"
          style={{ transform: `scaleX(${(viewModel.stepIndex + 1) / total})` }}
        />
      </div>
      <ol className="grid grid-cols-3">
        {reserveSteps.map((step, index) => {
          const done = index < viewModel.stepIndex
          const current = index === viewModel.stepIndex
          const label = (
            <span className={`text-label ${current ? 'text-accent' : done ? 'text-on-glass-on-image' : 'text-on-glass-on-image/60'}`}>{stepLabel[step]}</span>
          )
          return (
            <li key={step} className={index === 0 ? 'justify-self-start' : index === total - 1 ? 'justify-self-end' : 'justify-self-center'}>
              {done ? (
                <button type="button" onClick={() => viewModel.goTo(step)} className={`${textButtonClass} px-xs`}>
                  {label}
                </button>
              ) : (
                <span aria-current={current ? 'step' : undefined} className="inline-flex min-h-touch-target items-center px-xs">
                  {label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Panel({ title, trailing, children }: { title: string; trailing?: ReactNode; children: ReactNode }) {
  return (
    <section className={panelClass}>
      <div className="flex items-baseline justify-between gap-md">
        <h2 className="text-overline uppercase tracking-(--spacing-tracking) text-primary">{title}</h2>
        {trailing}
      </div>
      {children}
    </section>
  )
}

type StepProps = { viewModel: ReserveViewModel; restaurant: Restaurant; draft: ReservationDraft }

function DetailsStep({ viewModel, restaurant, draft }: StepProps) {
  return (
    <>
      <Panel title={strings.reserveGuests}>
        <Stepper
          value={draft.partySize}
          min={MIN_GUESTS}
          max={restaurant.maxPartySize}
          onChange={viewModel.setPartySize}
          text={strings.reserveGuestCount(draft.partySize)}
          decreaseLabel={strings.reserveRemoveGuest}
          increaseLabel={strings.reserveAddGuest}
          decreaseTestId="reserve.guests.decrease"
          increaseTestId="reserve.guests.increase"
          countTestId="reserve.guests.count"
        />
        {viewModel.largeParty && (
          <p data-testid="reserve.largeParty" className="text-caption text-on-surface-variant motion-safe:animate-fade-in">
            {strings.reserveLargeParty({ max: restaurant.maxPartySize })}
          </p>
        )}
      </Panel>
      <Panel title={strings.reserveDate} trailing={<span className="text-caption text-on-surface-variant">{Formatters.monthYear(draft.date)}</span>}>
        <div className="scrollbar-none -mx-lg flex snap-x gap-sm overflow-x-auto scroll-px-lg px-lg pb-xs">
          {viewModel.dates.map((date, index) => {
            const selected = date === draft.date
            const closed = DemoAvailability.isClosed(restaurant, date)
            const weekday = index === 0 ? strings.reserveToday : index === 1 ? strings.reserveTomorrow : Formatters.weekdayShort(date)
            return (
              <button
                key={date}
                type="button"
                data-testid={`reserve.date.${date}`}
                aria-pressed={selected}
                aria-label={Formatters.dateLong(date)}
                onClick={() => viewModel.setDate(date)}
                className={`flex w-(--spacing-date-chip-width) shrink-0 snap-start flex-col items-center gap-xxs rounded-md border py-sm motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy active:scale-97 ${focusRing} ${
                  selected ? 'border-espresso bg-espresso text-on-espresso' : 'border-outline bg-surface text-on-surface hover:border-primary'
                } ${closed && !selected ? 'opacity-40' : ''}`}
              >
                <span className="truncate text-caption">{weekday}</span>
                <AppSerif role="title" as="span">
                  {parseIsoDate(date).getDate()}
                </AppSerif>
              </button>
            )
          })}
        </div>
      </Panel>
      <Panel title={strings.reserveTime}>
        {viewModel.closed ? (
          <p data-testid="reserve.closed" className="text-body text-on-surface-variant">
            {strings.reserveClosedDay}
          </p>
        ) : viewModel.noSlots ? (
          <p data-testid="reserve.noSlots" className="text-body text-on-surface-variant">
            {strings.reserveNoSlots}
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-sm">
            {viewModel.slots.map((slot) =>
              slot.available ? (
                <Chip key={slot.time} testId={timeTestId(slot.time)} selected={draft.time === slot.time} onClick={() => viewModel.setTime(slot.time)}>
                  {Formatters.time(slot.time)}
                </Chip>
              ) : (
                <Chip
                  key={slot.time}
                  testId={timeTestId(slot.time)}
                  disabled
                  aria-label={strings.reserveSlotUnavailable({ time: Formatters.time(slot.time) })}
                  className="line-through"
                >
                  {Formatters.time(slot.time)}
                </Chip>
              ),
            )}
          </div>
        )}
        <DemoNote />
      </Panel>
    </>
  )
}

function PreferencesStep({ viewModel, restaurant, draft }: StepProps) {
  const notesCount = draft.notes.length
  return (
    <>
      <Panel title={strings.reserveSeating}>
        <div className="grid grid-cols-2 gap-md">
          {restaurant.seating.map((seating) => {
            const Icon = seatingIcon[seating]
            const selected = draft.seating === seating
            return (
              <button
                key={seating}
                type="button"
                data-testid={`reserve.seating.${seating}`}
                aria-pressed={selected}
                onClick={() => viewModel.setSeating(seating)}
                className={`flex min-h-(--spacing-huge) flex-col items-start gap-sm rounded-lg border p-md text-start motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy active:scale-97 ${focusRing} ${
                  selected ? 'border-espresso bg-espresso text-on-espresso' : 'border-outline bg-surface text-on-surface hover:border-primary'
                }`}
              >
                <Icon className={`size-icon-lg ${selected ? 'text-accent' : 'text-primary'}`} />
                <span className="text-label">{seatingLabel(seating)}</span>
              </button>
            )
          })}
        </div>
      </Panel>
      <Panel title={strings.reserveOccasion}>
        <div className="flex flex-wrap gap-x-sm">
          {occasions.map((occasion) => (
            <Chip
              key={occasion}
              testId={`reserve.occasion.${occasion}`}
              icon={occasionIcon[occasion]}
              selected={draft.occasion === occasion}
              onClick={() => viewModel.setOccasion(occasion)}
            >
              {occasionLabel(occasion)}
            </Chip>
          ))}
        </div>
      </Panel>
      <Panel title={strings.reserveDietary}>
        <div className="flex flex-wrap gap-x-sm">
          {dietaryOptions.map((dietary) => (
            <Chip key={dietary} testId={`reserve.dietary.${dietary}`} selected={draft.dietary.includes(dietary)} onClick={() => viewModel.toggleDietary(dietary)}>
              {dietaryLabel(dietary)}
            </Chip>
          ))}
        </div>
      </Panel>
      <Panel title={strings.reserveNotes}>
        <label className="flex flex-col gap-xs">
          <span className="sr-only">{strings.reserveNotes}</span>
          <textarea
            data-testid="reserve.notes"
            value={draft.notes}
            rows={4}
            onChange={(event) => viewModel.setNotes(event.target.value)}
            placeholder={strings.reserveNotesPlaceholder}
            aria-invalid={viewModel.notesTooLong}
            aria-describedby="reserve-notes-count"
            className={`w-full resize-y rounded-md border bg-surface p-md text-body text-on-surface placeholder:text-on-surface-variant ${focusRing} ${
              viewModel.notesTooLong ? 'border-error' : 'border-outline focus:border-primary'
            }`}
          />
          <span id="reserve-notes-count" className={`flex justify-between gap-md text-caption ${viewModel.notesTooLong ? 'text-error' : 'text-on-surface-variant'}`}>
            <span>{viewModel.notesTooLong ? strings.reserveErrorNotesTooLong({ max: MAX_NOTES_LENGTH }) : ''}</span>
            <span className="tabular-nums">{strings.reserveNotesCount({ count: notesCount, max: MAX_NOTES_LENGTH })}</span>
          </span>
        </label>
      </Panel>
    </>
  )
}

function ReviewStep({ viewModel, restaurant, draft }: StepProps) {
  const none = strings.reserveSummaryNone
  return (
    <section className={panelClass}>
      <AppSerif role="title" as="h2" className="text-on-surface">
        {strings.reserveReviewTitle}
      </AppSerif>
      <div className="relative rounded-lg bg-surface p-lg shadow-low">
        <div aria-hidden="true" className="pointer-events-none absolute inset-sm rounded-md border border-accent/60" />
        <div className="relative flex flex-col gap-md">
          <div className="flex items-center gap-md">
            <RemoteImage src={restaurant.heroImage} alt={restaurant.name} className="size-thumbnail shrink-0 rounded-md" />
            <AppSerif role="title" as="p" className="text-on-surface">
              {restaurant.name}
            </AppSerif>
          </div>
          <dl className="flex flex-col divide-y divide-outline/40">
            <SummaryRow label={strings.reserveSummaryWhen} onEdit={() => viewModel.goTo('details')}>
              {draft.time && Formatters.separator(Formatters.dateLong(draft.date), Formatters.time(draft.time))}
            </SummaryRow>
            <SummaryRow label={strings.reserveSummaryParty} onEdit={() => viewModel.goTo('details')}>
              {strings.reserveGuestCount(draft.partySize)}
            </SummaryRow>
            <SummaryRow label={strings.reserveSummarySeating} onEdit={() => viewModel.goTo('preferences')}>
              {seatingLabel(draft.seating)}
            </SummaryRow>
            <SummaryRow label={strings.reserveSummaryOccasion} onEdit={() => viewModel.goTo('preferences')}>
              {draft.occasion === 'none' ? none : occasionLabel(draft.occasion)}
            </SummaryRow>
            <SummaryRow label={strings.reserveSummaryDietary} onEdit={() => viewModel.goTo('preferences')}>
              {dietarySummary(draft.dietary)}
            </SummaryRow>
            <SummaryRow label={strings.reserveSummaryNotes} onEdit={() => viewModel.goTo('preferences')}>
              {draft.notes.trim() === '' ? none : draft.notes}
            </SummaryRow>
          </dl>
        </div>
      </div>
      <p className="text-caption text-on-surface-variant">{strings.reservePolicy}</p>
    </section>
  )
}

function SummaryRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-md py-sm">
      <div className="flex min-w-0 flex-col gap-xxs">
        <dt className="text-caption text-on-surface-variant">{label}</dt>
        <dd className="break-words text-body text-on-surface">{children}</dd>
      </div>
      <button type="button" onClick={onEdit} className={`${textButtonClass} shrink-0 text-primary`}>
        {strings.reserveSummaryEdit}
      </button>
    </div>
  )
}
