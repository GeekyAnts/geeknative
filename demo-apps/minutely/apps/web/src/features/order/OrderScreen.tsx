import { Link, useParams } from '@tanstack/react-router'
import { AppCard } from '#/core/designsystem/AppCard'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { primaryButton } from '#/core/designsystem/buttons'
import { tileClass } from '#/features/catalog/Catalog'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { Order } from './Order'
import { useOrderViewModel } from './useOrderViewModel'

type StepState = 'done' | 'current' | 'pending'

const steps = (): { label: string; state: StepState }[] => [
  { label: strings.orderStepConfirmed, state: 'done' },
  { label: strings.orderStepPacking, state: 'current' },
  { label: strings.orderStepOnTheWay, state: 'pending' },
  { label: strings.orderStepDelivered, state: 'pending' },
]

function ContinueShopping() {
  return (
    <Link to="/" data-testid="order.continueShopping" className={primaryButton}>
      {strings.orderContinueShopping}
    </Link>
  )
}

/** The Order placed screen (spec/features/order.md). */
export function OrderScreen() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const { state, deliveryMinutes } = useOrderViewModel(orderId)

  if (state.status === 'loading') return null
  if (state.status === 'notFound') {
    return (
      <EmptyState
        testId="order.notFound"
        headingLevel={1}
        icon={AppIcons.receipt}
        title={strings.orderNotFoundTitle}
        body={strings.orderNotFoundBody}
        action={<ContinueShopping />}
      />
    )
  }
  return <OrderPlaced order={state.order} deliveryMinutes={deliveryMinutes} />
}

function OrderPlaced({ order, deliveryMinutes }: { order: Order; deliveryMinutes: number }) {
  return (
    <div className="mx-auto flex w-full max-w-(--container-xl) flex-col gap-lg">
      <section className="flex flex-col items-center gap-sm py-lg text-center">
        <span className="mb-md grid size-24 place-items-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/30 motion-safe:animate-scale-in">
          <AppIcons.orderPlaced aria-hidden className="size-12" />
        </span>
        <h1 className="text-headline">{strings.orderPlacedTitle}</h1>
        <p className="max-w-(--container-sm) text-body text-on-surface-variant">{strings.orderPlacedBody({ minutes: deliveryMinutes })}</p>
        <p data-testid="order.number" className="mt-sm rounded-full bg-surface-variant px-lg py-xs text-label font-semibold">
          {strings.orderNumber({ id: order.id })}
        </p>
      </section>

      <AppCard className="flex flex-col gap-lg">
        <h2 className="text-title">{strings.orderTrackingTitle}</h2>
        <ol className="flex flex-col">
          {steps().map((step, index, all) => (
            <li key={step.label} className="flex gap-md" aria-current={step.state === 'current' ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <StepDot state={step.state} />
                {index < all.length - 1 && (
                  <span aria-hidden className={`min-h-6 w-0.5 flex-1 ${step.state === 'done' ? 'bg-primary' : 'bg-outline'}`} />
                )}
              </div>
              <p
                className={`pb-lg text-body ${
                  step.state === 'current' ? 'font-bold' : step.state === 'pending' ? 'text-on-surface-variant' : ''
                }`}
              >
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      </AppCard>

      <AppCard className="flex flex-col gap-md">
        <div className="flex items-baseline justify-between gap-md">
          <h2 className="text-title">{strings.orderSummaryTitle}</h2>
          <p className="text-label text-on-surface-variant">{strings.commonItemCount(order.itemCount)}</p>
        </div>
        <ul className="flex flex-col gap-md">
          {order.lines.map((line) => (
            <li key={line.productId} data-testid={`order.line.${line.productId}`} className="flex items-center gap-md">
              <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-md text-2xl ${tileClass(line.categoryId)}`}>
                {line.emoji}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-label font-semibold">{strings.orderLineQuantity({ name: line.name, count: line.quantity })}</p>
                <p className="text-caption text-on-surface-variant">{line.unit}</p>
              </div>
              <span className="text-body font-bold">{strings.commonPrice({ amount: line.price * line.quantity })}</span>
            </li>
          ))}
        </ul>
        <hr className="border-outline" />
        <div className="flex items-center justify-between text-body font-bold">
          <span>{strings.orderTotal}</span>
          <span data-testid="order.total">{strings.commonPrice({ amount: order.toPay })}</span>
        </div>
      </AppCard>

      <div className="flex justify-center pt-sm pb-xl">
        <ContinueShopping />
      </div>
    </div>
  )
}

function StepDot({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
        <AppIcons.check aria-hidden className="size-icon-sm" />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-primary bg-surface">
        <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    )
  }
  return <span className="size-6 shrink-0 rounded-full border-2 border-outline bg-surface" />
}
