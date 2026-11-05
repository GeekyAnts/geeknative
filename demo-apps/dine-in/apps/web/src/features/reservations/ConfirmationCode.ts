export const CONFIRMATION_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

/** "DC-" followed by 6 random characters from the allowed alphabet, regenerated if it collides with `existing`. */
export function generateConfirmationCode(existing: Iterable<string> = [], random: () => number = Math.random): string {
  const taken = new Set(existing)
  for (;;) {
    let code = 'DC-'
    for (let index = 0; index < CODE_LENGTH; index++) {
      code += CONFIRMATION_CODE_ALPHABET[Math.floor(random() * CONFIRMATION_CODE_ALPHABET.length)]
    }
    if (!taken.has(code)) return code
  }
}

export const CONFIRMATION_CODE_PATTERN = new RegExp(`^DC-[${CONFIRMATION_CODE_ALPHABET}]{${CODE_LENGTH}}$`)
