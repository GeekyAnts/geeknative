import type { CartLine } from '#/features/cart/CartRepository'
import type { CartSummary } from '#/features/cart/CartSummary'
import type { Product } from '#/features/catalog/Catalog'

/** A product as it was when ordered, so an order still reads correctly if the catalog changes. */
export interface OrderLine {
  productId: string
  name: string
  unit: string
  emoji: string
  categoryId: string
  price: number
  mrp: number
  quantity: number
}

/** A placed cart. Stored with exactly these field names on every platform. */
export interface Order {
  id: string
  placedAt: number
  lines: OrderLine[]
  itemCount: number
  itemTotal: number
  savings: number
  deliveryFee: number
  toPay: number
}

/** `MN` followed by `placedAt % 1000000`, zero-padded to 6 digits: 1761800123456 → MN123456. */
export function orderId(placedAt: number): string {
  return `MN${String(Math.floor(placedAt) % 1000000).padStart(6, '0')}`
}

/** Builds an order from the cart's lines and summary, copying each product's details. */
export function buildOrder(
  lines: readonly CartLine[],
  summary: CartSummary,
  product: (productId: string) => Product | undefined,
  placedAt: number,
): Order {
  const orderLines = lines.flatMap((line): OrderLine[] => {
    const item = product(line.productId)
    if (!item) return []
    const { id, name, unit, emoji, categoryId, price, mrp } = item
    return [{ productId: id, name, unit, emoji, categoryId, price, mrp, quantity: line.quantity }]
  })
  return {
    id: orderId(placedAt),
    placedAt,
    lines: orderLines,
    itemCount: summary.itemCount,
    itemTotal: summary.itemTotal,
    savings: summary.savings,
    deliveryFee: summary.deliveryFee,
    toPay: summary.toPay,
  }
}
