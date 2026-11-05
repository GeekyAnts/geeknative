import { Link } from '@tanstack/react-router'
import { focusRing, pressable } from '#/core/designsystem/Buttons'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { Page } from '#/core/designsystem/Page'
import { Reveal } from '#/core/designsystem/Reveal'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { TopBar } from '#/core/designsystem/TopBar'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useNotificationsViewModel } from './useNotificationsViewModel'

export function NotificationsScreen() {
  const viewModel = useNotificationsViewModel()

  return (
    <div className="min-h-dvh bg-background">
      <TopBar title={strings.notificationsTitle} />
      <main>
        <Page className="pt-md">
          <ScreenHeader title={strings.notificationsTitle} />
          {viewModel.loading ? (
            <div className="flex flex-col gap-md">
              <Skeleton className="h-thumbnail rounded-lg" />
              <Skeleton className="h-thumbnail rounded-lg" />
            </div>
          ) : viewModel.items.length === 0 ? (
            <EmptyState icon={AppIcons.bell} title={strings.notificationsEmptyTitle} body={strings.notificationsEmptyBody} testId="notifications.empty" />
          ) : (
            <ul className="flex flex-col gap-md">
              {viewModel.items.map((item, index) => (
                <Reveal as="li" key={item.id} index={index}>
                  <Link
                    to="/reservations/$reservationId"
                    params={{ reservationId: item.id }}
                    data-testid={`notifications.item.${item.id}`}
                    className={`flex items-start gap-md rounded-lg bg-surface p-lg text-on-surface hover:shadow-low ${pressable} ${focusRing}`}
                  >
                    <span className="flex size-touch-target shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                      <AppIcons.bell className="size-icon-md" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-xxs">
                      <span className="text-body">{item.text}</span>
                      <span className="text-caption tracking-(--spacing-tracking) text-on-surface-variant">{item.code}</span>
                    </span>
                    <AppIcons.chevronRight className="mt-sm size-icon-md shrink-0 text-on-surface-variant" />
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </Page>
      </main>
    </div>
  )
}
