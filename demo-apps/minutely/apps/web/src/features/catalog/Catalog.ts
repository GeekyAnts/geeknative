/** A group of products, such as Fruits & Vegetables (PRODUCT.md, Glossary). */
export interface Category {
  id: string
  name: string
  emoji: string
}

/** Something you can buy. Prices are whole rupees. */
export interface Product {
  id: string
  name: string
  unit: string
  price: number
  mrp: number
  emoji: string
  categoryId: string
  isBestseller: boolean
}

/** `(mrp - price) * 100 / mrp`, rounded down. 0 means no badge and no struck-through MRP. */
export function discountPercent(product: Pick<Product, 'price' | 'mrp'>): number {
  if (product.mrp <= 0 || product.mrp <= product.price) return 0
  return Math.floor(((product.mrp - product.price) * 100) / product.mrp)
}

/**
 * The tile token behind a category's artwork (`tile` + the capitalized id).
 * Written out in full so Tailwind finds every class.
 */
const tileClasses: Record<string, string> = {
  fruits: 'bg-tile-fruits',
  dairy: 'bg-tile-dairy',
  snacks: 'bg-tile-snacks',
  drinks: 'bg-tile-drinks',
  household: 'bg-tile-household',
  personal: 'bg-tile-personal',
}

export function tileClass(categoryId: string): string {
  return tileClasses[categoryId] ?? 'bg-surface-variant'
}
