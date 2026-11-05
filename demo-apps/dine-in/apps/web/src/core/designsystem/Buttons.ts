/** Shared class names, so links styled as buttons look exactly like the buttons. */

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export const pressable = 'motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy active:scale-97'

const buttonBase = `inline-flex h-button min-h-touch-target items-center justify-center gap-sm rounded-full px-xl text-label select-none disabled:pointer-events-none disabled:opacity-40 ${pressable} ${focusRing}`

/** `espresso` fill with `onEspresso` label. */
export const primaryButtonClass = `${buttonBase} bg-espresso text-on-espresso hover:bg-primary`

/** Transparent with a `primary` hairline border and `primary` text. */
export const secondaryButtonClass = `${buttonBase} border border-primary text-primary hover:bg-surface-variant`

/** Inverted primary on dark bands: `accent` fill, `onAccent` text. */
export const accentButtonClass = `${buttonBase} bg-accent text-on-accent`

/** A secondary button in `onEspresso` colours, for espresso bands. */
export const onEspressoButtonClass = `${buttonBase} border border-on-espresso/60 text-on-espresso hover:bg-on-espresso/10`

/** Small action buttons on cards. */
const smallBase = `inline-flex min-h-touch-target items-center justify-center gap-xs rounded-full px-lg text-label ${pressable} ${focusRing}`
export const smallSecondaryButtonClass = `${smallBase} border border-primary text-primary hover:bg-surface-variant`
export const smallPrimaryButtonClass = `${smallBase} bg-espresso text-on-espresso hover:bg-primary`

/** A text-only button. */
export const textButtonClass = `inline-flex min-h-touch-target items-center justify-center gap-xs rounded-full px-md text-label ${pressable} ${focusRing}`
