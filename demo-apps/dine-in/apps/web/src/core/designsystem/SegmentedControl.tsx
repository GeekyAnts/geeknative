import { focusRing } from './Buttons'
import { glassClass } from './GlassSurface'

/** Glass pills with a sliding `espresso` selection (snappy spring). */
export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  label,
}: {
  options: { id: T; label: string; count?: number; testId?: string }[]
  selected: T
  onSelect: (id: T) => void
  label?: string
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.id === selected),
  )
  return (
    <div role="tablist" aria-label={label} className={`relative flex rounded-full p-xs ${glassClass()}`}>
      <span
        aria-hidden="true"
        className="absolute inset-y-xs start-xs rounded-full bg-espresso shadow-low motion-safe:transition-transform motion-safe:duration-snappy motion-safe:ease-snappy"
        style={{ width: `calc((100% - var(--spacing-sm)) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => {
        const active = option.id === selected
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={option.testId}
            onClick={() => onSelect(option.id)}
            className={`relative z-10 flex min-h-touch-target flex-1 items-center justify-center gap-xs rounded-full px-sm text-label motion-safe:transition-colors motion-safe:duration-snappy motion-safe:ease-snappy ${
              active ? 'text-on-espresso' : 'text-on-surface-variant hover:text-on-surface'
            } ${focusRing}`}
          >
            <span className="truncate">{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`min-w-(--spacing-lg) rounded-full px-xs text-caption tabular-nums ${active ? 'bg-on-espresso/15' : 'bg-surface-variant'}`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
