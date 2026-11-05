import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { focusRing, secondaryButtonClass } from '#/core/designsystem/Buttons'
import { ConfirmationDialog } from '#/core/designsystem/ConfirmationDialog'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { Page } from '#/core/designsystem/Page'
import { Reveal } from '#/core/designsystem/Reveal'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { Switch } from '#/core/designsystem/Switch'
import { staggerDelay } from '#/core/motion'
import { Formatters } from '#/features/catalog/Formatters'
import type { IconComponent } from '#/features/catalog/Labels'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useProfileViewModel } from './useProfileViewModel'

type ProfileViewModel = ReturnType<typeof useProfileViewModel>

export function ProfileScreen() {
  const viewModel = useProfileViewModel()

  if (viewModel.status === 'error') {
    return (
      <Page width="readable" tabs className="pt-xl">
        <ErrorState onRetry={viewModel.retry} />
      </Page>
    )
  }

  return (
    <Page width="readable" tabs className="pt-xl">
      <ScreenHeader title={strings.profileTitle} />
      <MemberCard viewModel={viewModel} />
      <Stats viewModel={viewModel} />
      <Reveal as="nav" aria-label={strings.profileTitle}>
        <ul className="flex flex-col divide-y divide-outline/40 overflow-hidden rounded-lg bg-surface shadow-low">
          <RowLink icon={AppIcons.heart} label={strings.profileSavedRestaurants} testId="profile.savedRestaurants" link={{ to: '/saved' }} />
          <RowLink icon={AppIcons.utensils} label={strings.profilePreferences} testId="profile.preferences" link={{ to: '/profile/preferences' }} />
          <RowLink icon={AppIcons.clock} label={strings.profileHistory} testId="profile.history" link={{ to: '/reservations', search: { segment: 'past' } }} />
          <li>
            <label className="flex min-h-touch-target cursor-pointer items-center gap-md px-lg py-md hover:bg-surface-variant">
              <RowIcon icon={AppIcons.bell} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-subtitle text-on-surface">{strings.profileNotifications}</span>
                <span className="text-caption text-on-surface-variant">{strings.profileNotificationsBody}</span>
              </span>
              <Switch testId="profile.reminders" checked={viewModel.reminders} onChange={viewModel.toggleReminders} />
            </label>
          </li>
          <RowLink icon={AppIcons.settings} label={strings.profileSettings} testId="profile.settings" link={{ to: '/settings' }} />
          <RowLink icon={AppIcons.help} label={strings.profileHelp} testId="profile.help" link={{ to: '/help' }} />
        </ul>
      </Reveal>
      <button type="button" data-testid="profile.signOut" onClick={viewModel.askSignOut} className={`${secondaryButtonClass} w-full border-error text-error`}>
        <AppIcons.signOut className="size-icon-sm" />
        {strings.profileSignOut}
      </button>
      <p className="text-center text-caption text-on-surface-variant">{viewModel.versionText}</p>
      <ConfirmationDialog
        open={viewModel.confirmingSignOut}
        title={strings.profileSignOutConfirmTitle}
        message={strings.profileSignOutConfirmBody}
        confirmLabel={strings.profileSignOut}
        cancelLabel={strings.commonCancel}
        destructive
        onConfirm={viewModel.signOut}
        onCancel={viewModel.keepSignedIn}
      />
    </Page>
  )
}

function MemberCard({ viewModel }: { viewModel: ProfileViewModel }) {
  const { account } = viewModel
  return (
    <section className="relative isolate overflow-hidden rounded-xl bg-espresso p-xl text-on-espresso shadow-high motion-safe:animate-fade-up">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-135 from-accent/25 via-transparent to-accent/10" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-sm rounded-lg border border-accent/50" />
      <div className="flex items-center gap-lg">
        <span className="flex size-avatar-large shrink-0 items-center justify-center rounded-full bg-on-espresso/10 ring-2 ring-accent">
          <AppSerif role="display" as="span" className="text-accent">
            {viewModel.initials}
          </AppSerif>
        </span>
        <div className="flex min-w-0 flex-col gap-xxs">
          <p className="text-overline uppercase tracking-(--spacing-tracking) text-accent">{strings.profileMembership}</p>
          <AppSerif role="headline" as="h2" data-testid="profile.name" className="truncate text-on-espresso">
            {account?.name}
          </AppSerif>
          <p data-testid="profile.email" className="truncate text-caption text-on-espresso/80">
            {account?.email}
          </p>
          {account && <p className="text-caption text-on-espresso/70">{strings.profileMemberSince({ date: Formatters.monthYear(new Date(account.createdAt)) })}</p>}
        </div>
      </div>
    </section>
  )
}

function Stats({ viewModel }: { viewModel: ProfileViewModel }) {
  const tiles = [
    { label: strings.profileStatsUpcoming, value: viewModel.stats.upcoming, testId: 'profile.stats.upcoming' },
    { label: strings.profileStatsDined, value: viewModel.stats.dined, testId: 'profile.stats.dined' },
    { label: strings.profileStatsSaved, value: viewModel.stats.saved, testId: 'profile.stats.saved' },
  ]
  return (
    <dl className="grid grid-cols-3 gap-md">
      {tiles.map((tile, index) =>
        viewModel.status === 'loading' ? (
          <Skeleton key={tile.testId} className="h-(--spacing-huge) rounded-lg" />
        ) : (
          <div
            key={tile.testId}
            className={`flex flex-col-reverse items-center gap-xxs rounded-lg px-sm py-md motion-safe:animate-fade-up ${glassClass()}`}
            style={{ animationDelay: staggerDelay(index) }}
          >
            <dt className="text-caption text-on-surface-variant">{tile.label}</dt>
            <dd>
              <AppSerif role="headline" as="span" data-testid={tile.testId} className="text-on-surface tabular-nums">
                {tile.value}
              </AppSerif>
            </dd>
          </div>
        ),
      )}
    </dl>
  )
}

function RowIcon({ icon: Icon }: { icon: IconComponent }) {
  return (
    <span className="flex size-touch-target shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
      <Icon className="size-icon-md" />
    </span>
  )
}

function RowLink({ icon, label, testId, link, trailing }: { icon: IconComponent; label: string; testId: string; link: LinkProps; trailing?: ReactNode }) {
  return (
    <li>
      <Link
        {...link}
        data-testid={testId}
        className={`flex min-h-touch-target items-center gap-md px-lg py-md text-on-surface hover:bg-surface-variant motion-safe:transition-colors motion-safe:duration-fast ${focusRing} focus-visible:-outline-offset-2`}
      >
        <RowIcon icon={icon} />
        <span className="flex-1 text-subtitle">{label}</span>
        {trailing ?? <AppIcons.chevronRight className="size-icon-sm text-on-surface-variant rtl:-scale-x-100" />}
      </Link>
    </li>
  )
}
