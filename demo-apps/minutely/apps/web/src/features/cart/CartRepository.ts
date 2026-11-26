/** One product in the cart and its quantity (always 1 or more). */
export interface CartLine {
  productId: string
  quantity: number
}

/** Storage key, shared with the iOS and Android apps. */
export const CART_STORAGE_KEY = 'cart.items'

/**
 * Holds the cart for the whole app. Every method that changes the cart returns the new lines,
 * which the view models put in one shared query so every screen updates at once.
 */
export interface CartRepository {
  /** The lines, in the order products were first added. */
  lines(): Promise<CartLine[]>
  /** The line's quantity, or 0. */
  quantity(productId: string): Promise<number>
  /** +1; a new product is appended with quantity 1. */
  add(productId: string): Promise<CartLine[]>
  /** −1; at 0 the line is removed. Removing a product that isn't in the cart does nothing. */
  remove(productId: string): Promise<CartLine[]>
  /** Empties the cart. */
  clear(): Promise<CartLine[]>
}

/** `add` on plain lines. */
export function addLine(lines: readonly CartLine[], productId: string): CartLine[] {
  const existing = lines.find((line) => line.productId === productId)
  if (!existing) return [...lines, { productId, quantity: 1 }]
  return lines.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line))
}

/** `remove` on plain lines. */
export function removeLine(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.flatMap((line) => {
    if (line.productId !== productId) return [line]
    return line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : []
  })
}

/**
 * Reads stored lines: lines for unknown products or with a quantity below 1 are dropped first, then
 * duplicate lines for one product are merged at the first one's position by adding their quantities.
 * Unreadable data counts as an empty cart.
 */
export function parseCartLines(json: string | null | undefined, isKnownProduct: (productId: string) => boolean): CartLine[] {
  if (!json) return []
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(value)) return []
  const lines: CartLine[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue
    const { productId, quantity } = item as Record<string, unknown>
    if (typeof productId !== 'string' || !isKnownProduct(productId)) continue
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) continue
    // Duplicates merge into the first line for that product, adding their quantities.
    const existing = lines.find((line) => line.productId === productId)
    if (existing) existing.quantity += quantity
    else lines.push({ productId, quantity })
  }
  return lines
}
