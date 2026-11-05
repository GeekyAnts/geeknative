import { strings } from '#/generated/strings'
import { Formatters } from '#/features/catalog/Formatters'

const MAX_PRICE_LEVEL = 4

/** The price symbol repeated `level` times, the rest up to 4 in `outline`. */
export function PriceLevel({ level, onImage = false, className = '' }: { level: number; onImage?: boolean; className?: string }) {
  const symbol = Formatters.priceSymbol()
  return (
    <span className={`text-label ${className}`}>
      <span aria-hidden="true">
        <span className={onImage ? 'text-on-glass-on-image' : 'text-on-surface'}>{symbol.repeat(level)}</span>
        <span className={onImage ? 'text-on-glass-on-image/40' : 'text-outline'}>{symbol.repeat(Math.max(0, MAX_PRICE_LEVEL - level))}</span>
      </span>
      <span className="sr-only">{strings.restaurantPriceLabel({ level })}</span>
    </span>
  )
}
