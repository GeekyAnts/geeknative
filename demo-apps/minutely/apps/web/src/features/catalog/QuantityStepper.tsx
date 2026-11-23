import { useLayoutEffect, useRef } from 'react'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

/**
 * The add control (DESIGN.md: Quantity stepper). At 0, an outlined Add button; from 1, a filled `primary`
 * capsule with − count +. Keyboard focus follows the control when it switches between the two.
 */
export function QuantityStepper({
  productId,
  name,
  quantity,
  onAdd,
  onRemove,
}: {
  productId: string
  name: string
  quantity: number
  onAdd: () => void
  onRemove: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const keepFocus = useRef(false)
  const isEmpty = quantity === 0

  const run = (action: () => void) => () => {
    keepFocus.current = rootRef.current?.contains(document.activeElement) ?? false
    action()
  }

  // When Add turns into the stepper (or back), the focused button is replaced: move focus to its successor.
  useLayoutEffect(() => {
    if (!keepFocus.current) return
    keepFocus.current = false
    const root = rootRef.current
    if (root && !root.contains(document.activeElement)) {
      root.querySelector<HTMLButtonElement>(isEmpty ? 'button' : 'button:last-of-type')?.focus()
    }
  }, [isEmpty])

  return (
    <div ref={rootRef} className="h-9 w-24 shrink-0">
      {isEmpty ? (
        <button
          type="button"
          data-testid={`product.${productId}.add`}
          aria-label={strings.commonAddItem({ name })}
          onClick={run(onAdd)}
          className="size-full rounded-full border border-primary bg-surface text-label font-bold text-primary transition hover:bg-primary hover:text-on-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {strings.commonAdd}
        </button>
      ) : (
        <div className="flex size-full items-center justify-between rounded-full bg-primary text-on-primary shadow-sm motion-safe:animate-pop-in">
          <button
            type="button"
            data-testid={`product.${productId}.decrease`}
            aria-label={strings.commonDecrease({ name })}
            onClick={run(onRemove)}
            className="grid h-full w-9 place-items-center rounded-full transition hover:bg-on-primary/15 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <AppIcons.remove aria-hidden className="size-icon-sm" />
          </button>
          <span
            key={quantity}
            data-testid={`product.${productId}.quantity`}
            aria-hidden
            className="text-label font-bold tabular-nums motion-safe:animate-pop-in"
          >
            {quantity}
          </span>
          {/* Assistive technology reads the count as common.inCart ("2 in cart"), not a bare number. */}
          <span aria-live="polite" className="sr-only">
            {strings.commonInCart(quantity)}
          </span>
          <button
            type="button"
            data-testid={`product.${productId}.increase`}
            aria-label={strings.commonIncrease({ name })}
            onClick={run(onAdd)}
            className="grid h-full w-9 place-items-center rounded-full transition hover:bg-on-primary/15 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <AppIcons.add aria-hidden className="size-icon-sm" />
          </button>
        </div>
      )}
    </div>
  )
}
