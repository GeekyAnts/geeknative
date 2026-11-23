import type { Product } from '#/features/catalog/Catalog'
import { AppConfig } from '#/generated/config'
import type { CartLine } from './CartRepository'

/** The cart's totals, in whole rupees (spec/features/cart.md, Cart summary). */
export interface CartSummary {
  itemCount: number
  itemTotal: number
  mrpTotal: number
  savings: number
  deliveryFee: number
  toPay: number
  amountToFreeDelivery: number
}

export interface DeliveryPricing {
  freeDeliveryThreshold: number
  deliveryFee: number
}

const configPricing: DeliveryPricing = {
  freeDeliveryThreshold: AppConfig.freeDeliveryThreshold,
  deliveryFee: AppConfig.deliveryFee,
}

/** A pure function of the lines and the catalog, so every platform tests the same math. */
export function cartSummary(
  lines: readonly CartLine[],
  product: (productId: string) => Pick<Product, 'price' | 'mrp'> | undefined,
  pricing: DeliveryPricing = configPricing,
): CartSummary {
  let itemCount = 0
  let itemTotal = 0
  let mrpTotal = 0
  for (const line of lines) {
    const item = product(line.productId)
    if (!item) continue
    itemCount += line.quantity
    itemTotal += item.price * line.quantity
    mrpTotal += item.mrp * line.quantity
  }
  const deliveryFee = itemCount === 0 || itemTotal >= pricing.freeDeliveryThreshold ? 0 : pricing.deliveryFee
  return {
    itemCount,
    itemTotal,
    mrpTotal,
    savings: mrpTotal - itemTotal,
    deliveryFee,
    toPay: itemTotal + deliveryFee,
    amountToFreeDelivery: Math.max(0, pricing.freeDeliveryThreshold - itemTotal),
  }
}
