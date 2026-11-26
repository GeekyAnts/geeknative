import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { IconButton } from './IconButton'

export function TravelersStepper({
  value,
  onChange,
  testId,
}: {
  value: number
  onChange: (value: number) => void
  testId: string
}) {
  return (
    <div className="flex items-center gap-md">
      <IconButton label={strings.commonDecrease} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
        <AppIcons.chevronDown className="size-icon-md" />
      </IconButton>
      <span data-testid={testId} className="min-w-touch-target text-center text-title text-on-surface">
        {strings.plannerTravelersValue({ count: String(value) })}
      </span>
      <IconButton label={strings.commonIncrease} disabled={value >= 8} onClick={() => onChange(Math.min(8, value + 1))}>
        <AppIcons.plus className="size-icon-md" />
      </IconButton>
    </div>
  )
}
