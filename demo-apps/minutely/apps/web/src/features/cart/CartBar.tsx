import { Link } from '@tanstack/react-router'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useCart } from './useCart'

/**
 * The floating cart bar (DESIGN.md: Cart bar): fixed to the bottom of the viewport while the cart has items.
 * It slides up when it appears. Opens Cart.
 */
export function CartBar() {
  const { summary } = useCart()
  if (summary.itemCount === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-lg pb-safe">
      <Link
        to="/cart"
        data-testid="cartBar"
        className="pointer-events-auto mx-auto flex max-w-(--container-xl) items-center gap-md rounded-lg bg-primary p-md text-on-primary shadow-xl shadow-primary/30 transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:animate-slide-up"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-on-primary/15">
          <AppIcons.cart aria-hidden className="size-icon-md" />
        </span>
        <span className="flex flex-col">
          <span className="text-caption">{strings.commonItemCount(summary.itemCount)}</span>
          <span key={summary.itemTotal} className="text-title font-bold motion-safe:animate-pop-in">
            {strings.commonPrice({ amount: summary.itemTotal })}
          </span>
        </span>
        <span className="ms-auto flex items-center gap-xs text-label font-bold">
          {strings.cartBarViewCart}
          <AppIcons.chevronRight aria-hidden className="size-icon-md" />
        </span>
      </Link>
    </div>
  )
}

/** Room at the end of a screen so nothing is hidden behind the cart bar. */
export function CartBarSpacer() {
  const { summary } = useCart()
  return summary.itemCount > 0 ? <div aria-hidden className="h-24" /> : null
}
