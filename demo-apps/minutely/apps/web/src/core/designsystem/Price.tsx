import { strings } from '#/generated/strings'

/** A struck-through MRP, read as "MRP ₹60". Always follows the price it was reduced to (DESIGN.md: Money). */
export function StruckMrp({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <s className={`text-caption text-on-surface-variant ${className}`}>
      <span className="sr-only">{strings.commonMrp({ amount })}</span>
      <span aria-hidden>{strings.commonPrice({ amount })}</span>
    </s>
  )
}
