import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AppCard } from '#/core/designsystem/AppCard'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { StruckMrp } from '#/core/designsystem/Price'
import { primaryButton } from '#/core/designsystem/buttons'
import { tileClass } from '#/features/catalog/Catalog'
import { QuantityStepper } from '#/features/catalog/QuantityStepper'
import { AppConfig } from '#/generated/config'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useCart } from './useCart'
import { useCartViewModel, type CartItem } from './useCartViewModel'

export function CartScreen() {
  const viewModel = useCartViewModel()
  const { summary } = viewModel

  return (
    <div className="flex flex-col gap-xl">
      <h1 className="text-headline">{strings.cartTitle}</h1>

      {/* The cart is in localStorage: until the page hydrates, show nothing rather than an empty cart. */}
      {viewModel.ready && viewModel.items.length === 0 && (
        <EmptyState
          testId="cart.empty"
          icon={AppIcons.cart}
          title={strings.cartEmptyTitle}
          body={strings.cartEmptyBody}
          action={
            <Link to="/" data-testid="cart.startShopping" className={primaryButton}>
              {strings.cartStartShopping}
            </Link>
          }
        />
      )}

      {viewModel.ready && viewModel.items.length > 0 && (
        <>
          <div className="grid items-start gap-lg lg:grid-cols-5">
            <div className="flex flex-col gap-lg lg:col-span-3">
              <AppCard className="flex items-center gap-md">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                  <AppIcons.delivery aria-hidden className="size-icon-md" />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-title">{strings.commonDeliveryIn({ minutes: AppConfig.deliveryMinutes })}</h2>
                  <p className="text-caption text-on-surface-variant">{strings.cartShipment(summary.itemCount)}</p>
                </div>
              </AppCard>

              <section className="rounded-lg bg-surface text-on-surface">
                <ul className="divide-y divide-outline">
                  {viewModel.items.map((item) => (
                    <CartLineRow key={item.product.id} item={item} />
                  ))}
                </ul>
              </section>
            </div>

            <div className="flex flex-col gap-lg lg:col-span-2">
              <AppCard className="flex flex-col gap-md">
                <div data-testid="cart.freeDelivery" className="flex items-center gap-sm">
                  {summary.amountToFreeDelivery > 0 ? (
                    <>
                      <AppIcons.delivery aria-hidden className="size-icon-md shrink-0 text-on-surface-variant" />
                      <p className="text-label">{strings.cartFreeDeliveryNudge({ amount: summary.amountToFreeDelivery })}</p>
                    </>
                  ) : (
                    <>
                      <AppIcons.orderPlaced aria-hidden className="size-icon-md shrink-0 text-primary" />
                      <p className="text-label font-bold text-primary">{strings.cartFreeDeliveryUnlocked}</p>
                    </>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-variant" aria-hidden>
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${viewModel.freeDeliveryProgress * 100}%` }}
                  />
                </div>
              </AppCard>

              <section className="flex flex-col gap-md rounded-lg bg-surface text-on-surface">
                <div className="flex flex-col gap-md px-lg pt-lg">
                  <h2 className="text-title">{strings.cartBillTitle}</h2>
                  <BillRow label={strings.cartItemTotal}>
                    <span className="flex items-baseline gap-sm">
                      <span data-testid="cart.itemTotal">{strings.commonPrice({ amount: summary.itemTotal })}</span>
                      {summary.savings > 0 && <StruckMrp amount={summary.mrpTotal} />}
                    </span>
                  </BillRow>
                  <BillRow label={strings.cartDeliveryFee}>
                    <span data-testid="cart.deliveryFee" className={summary.deliveryFee === 0 ? 'font-bold text-primary' : ''}>
                      {summary.deliveryFee === 0 ? strings.cartFree : strings.commonPrice({ amount: summary.deliveryFee })}
                    </span>
                  </BillRow>
                  <hr className="border-outline" />
                  <div className="flex items-center justify-between text-body font-bold">
                    <span>{strings.cartToPay}</span>
                    <span data-testid="cart.toPay">{strings.commonPrice({ amount: summary.toPay })}</span>
                  </div>
                </div>
                {summary.savings > 0 ? (
                  <p
                    data-testid="cart.savings"
                    className="flex items-center gap-sm rounded-b-lg bg-surface-variant px-lg py-md text-label font-semibold text-primary"
                  >
                    <AppIcons.savings aria-hidden className="size-icon-md shrink-0" />
                    {strings.cartSavings({ amount: summary.savings })}
                  </p>
                ) : (
                  <div className="pb-xs" />
                )}
              </section>

              <AppCard className="flex items-center gap-md">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-variant text-on-surface-variant">
                  <AppIcons.location aria-hidden className="size-icon-md" />
                </span>
                <div className="flex flex-col">
                  <p className="text-caption text-on-surface-variant">{strings.cartDeliverTo}</p>
                  <p className="text-body">{strings.commonDeliveryAddress}</p>
                </div>
              </AppCard>
            </div>
          </div>

          <div aria-hidden className="h-24" />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface pt-md pb-safe motion-safe:animate-slide-up">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-lg px-lg">
              <div className="flex flex-col">
                <span className="text-title font-bold">{strings.commonPrice({ amount: summary.toPay })}</span>
                <span className="text-caption text-on-surface-variant">{strings.cartPaymentNote}</span>
              </div>
              <button
                type="button"
                data-testid="cart.placeOrder"
                disabled={viewModel.isPlacing}
                onClick={() => void viewModel.placeOrder()}
                className={`${primaryButton} min-w-40`}
              >
                {strings.cartPlaceOrder}
                <AppIcons.chevronRight aria-hidden className="size-icon-md" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BillRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-body">
      <span className="text-on-surface-variant">{label}</span>
      {children}
    </div>
  )
}

function CartLineRow({ item }: { item: CartItem }) {
  const cart = useCart()
  const { product } = item
  return (
    <li data-testid={`cart.line.${product.id}`} className="flex items-center gap-md p-lg">
      <span aria-hidden className={`grid size-14 shrink-0 place-items-center rounded-md text-3xl ${tileClass(product.categoryId)}`}>
        {product.emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 text-label font-semibold">{product.name}</p>
        <p className="text-caption text-on-surface-variant">{product.unit}</p>
      </div>
      <QuantityStepper
        productId={product.id}
        name={product.name}
        quantity={item.quantity}
        onAdd={() => void cart.add(product.id)}
        onRemove={() => void cart.remove(product.id)}
      />
      <div className="flex w-16 shrink-0 flex-col items-end">
        <span className="text-body font-bold">{strings.commonPrice({ amount: item.linePrice })}</span>
        {item.lineMrp > item.linePrice && <StruckMrp amount={item.lineMrp} />}
      </div>
    </li>
  )
}
