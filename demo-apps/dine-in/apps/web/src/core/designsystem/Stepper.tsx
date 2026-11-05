import { AppIcons } from '#/generated/icons'
import { AppSerif } from './AppSerif'
import { GlassIconButton } from './GlassIconButton'

/** Minus / plus glass buttons around a serif value. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  text,
  decreaseLabel,
  increaseLabel,
  decreaseTestId,
  increaseTestId,
  countTestId,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  text: string
  decreaseLabel: string
  increaseLabel: string
  decreaseTestId?: string
  increaseTestId?: string
  countTestId?: string
}) {
  return (
    <div className="flex items-center justify-between gap-md">
      <GlassIconButton
        icon={AppIcons.minus}
        label={decreaseLabel}
        testId={decreaseTestId}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <AppSerif role="title" as="output" aria-live="polite" data-testid={countTestId} className="flex-1 text-center tabular-nums">
        {text}
      </AppSerif>
      <GlassIconButton
        icon={AppIcons.plus}
        label={increaseLabel}
        testId={increaseTestId}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  )
}
