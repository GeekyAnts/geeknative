import { useId } from 'react'

export interface SegmentedOption<T extends string> {
  id: T
  label: string
}

/**
 * A single choice drawn as a segmented control (DESIGN.md: Segmented single choice): native radio
 * buttons, so arrow keys and screen readers work as for any radio group.
 */
export function SegmentedControl<T extends string>({
  label,
  showLabel = false,
  options,
  value,
  onChange,
  disabled = false,
  testId,
}: {
  label: string
  showLabel?: boolean
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  testId?: string
}) {
  const name = useId()
  const labelId = `${name}-label`

  return (
    <div className="flex flex-col gap-sm">
      <span id={labelId} className={showLabel ? 'text-label text-on-surface-variant' : 'sr-only'}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-disabled={disabled || undefined}
        data-testid={testId}
        className="flex w-full gap-xs rounded-lg bg-surface-variant p-xs"
      >
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex min-h-touch-target flex-1 items-center justify-center rounded-md px-sm text-label has-checked:bg-surface has-checked:text-on-surface has-checked:shadow-low has-focus-visible:outline-2 has-focus-visible:outline-primary motion-safe:transition duration-fast ease-standard ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              disabled={disabled}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <span className="text-center">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
