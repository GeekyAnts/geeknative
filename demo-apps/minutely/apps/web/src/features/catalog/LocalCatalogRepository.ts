import type { Category, Product } from './Catalog'
import type { CatalogRepository } from './CatalogRepository'

// Names, units and emoji are catalog data, not copy (spec/features/catalog.md). Same data, same order, on every platform.
export const catalogCategories: readonly Category[] = [
  { id: 'fruits', name: 'Fruits & Vegetables', emoji: '🥦' },
  { id: 'dairy', name: 'Dairy, Bread & Eggs', emoji: '🥛' },
  { id: 'snacks', name: 'Snacks & Munchies', emoji: '🍿' },
  { id: 'drinks', name: 'Cold Drinks & Juices', emoji: '🧃' },
  { id: 'household', name: 'Cleaning Essentials', emoji: '🧽' },
  { id: 'personal', name: 'Personal Care', emoji: '🧴' },
]

const p = (
  id: string,
  name: string,
  unit: string,
  price: number,
  mrp: number,
  emoji: string,
  categoryId: string,
  isBestseller: boolean,
): Product => ({ id, name, unit, price, mrp, emoji, categoryId, isBestseller })

export const catalogProducts: readonly Product[] = [
  p('banana', 'Robusta Banana', '6 pcs', 49, 60, '🍌', 'fruits', true),
  p('apple', 'Shimla Apple', '4 pcs', 129, 160, '🍎', 'fruits', true),
  p('tomato', 'Hybrid Tomato', '500 g', 24, 30, '🍅', 'fruits', false),
  p('avocado', 'Hass Avocado', '1 pc', 149, 199, '🥑', 'fruits', false),
  p('carrot', 'Ooty Carrot', '500 g', 39, 45, '🥕', 'fruits', false),
  p('milk', 'Toned Milk', '500 ml', 28, 28, '🥛', 'dairy', true),
  p('eggs', 'Farm Fresh Eggs', '6 pcs', 54, 60, '🥚', 'dairy', false),
  p('bread', 'Whole Wheat Bread', '400 g', 45, 50, '🍞', 'dairy', true),
  p('cheese', 'Cheese Slices', '200 g', 135, 150, '🧀', 'dairy', false),
  p('butter', 'Salted Butter', '100 g', 58, 60, '🧈', 'dairy', false),
  p('chips', 'Classic Salted Chips', '52 g', 20, 20, '🍟', 'snacks', false),
  p('popcorn', 'Butter Popcorn', '90 g', 45, 55, '🍿', 'snacks', false),
  p('cookies', 'Choco Chip Cookies', '150 g', 60, 75, '🍪', 'snacks', true),
  p('chocolate', 'Dark Chocolate 70%', '100 g', 175, 199, '🍫', 'snacks', true),
  p('pretzels', 'Salted Pretzels', '100 g', 99, 120, '🥨', 'snacks', false),
  p('cola', 'Cola Can', '300 ml', 40, 40, '🥤', 'drinks', false),
  p('orange-juice', 'Fresh Orange Juice', '1 L', 125, 150, '🍊', 'drinks', true),
  p('coconut-water', 'Tender Coconut Water', '200 ml', 55, 60, '🥥', 'drinks', false),
  p('cold-brew', 'Cold Brew Coffee', '250 ml', 120, 150, '☕', 'drinks', false),
  p('water', 'Mineral Water', '1 L', 20, 20, '💧', 'drinks', false),
  p('sponges', 'Scrub Sponges', '3 pcs', 49, 60, '🧽', 'household', false),
  p('detergent', 'Liquid Detergent', '1 L', 199, 249, '🫧', 'household', true),
  p('kitchen-towels', 'Kitchen Towels', '2 rolls', 89, 110, '🧻', 'household', false),
  p('broom', 'Soft Broom', '1 pc', 149, 199, '🧹', 'household', false),
  p('garbage-bags', 'Garbage Bags', '30 pcs', 79, 99, '🗑️', 'household', false),
  p('toothpaste', 'Herbal Toothpaste', '150 g', 95, 110, '🪥', 'personal', false),
  p('shampoo', 'Daily Shampoo', '340 ml', 245, 299, '🧴', 'personal', false),
  p('soap', 'Moisturising Soap', '4 × 100 g', 160, 200, '🧼', 'personal', true),
  p('lip-balm', 'Lip Balm', '4.5 g', 99, 125, '💄', 'personal', false),
  p('razor', 'Classic Razor', '1 pc', 149, 175, '🪒', 'personal', false),
]

/** The catalog bundled with the app. A backend-backed repository can replace it in AppContainer. */
export class LocalCatalogRepository implements CatalogRepository {
  private readonly byId = new Map(catalogProducts.map((product) => [product.id, product]))
  private readonly categoryNames = new Map(catalogCategories.map((category) => [category.id, category.name]))

  categories(): Category[] {
    return [...catalogCategories]
  }

  products(categoryId: string): Product[] {
    return catalogProducts.filter((product) => product.categoryId === categoryId)
  }

  product(id: string): Product | undefined {
    return this.byId.get(id)
  }

  bestsellers(): Product[] {
    return catalogProducts.filter((product) => product.isBestseller)
  }

  search(query: string): Product[] {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return []
    return catalogProducts.filter((product) => {
      const haystack = `${product.name} ${this.categoryNames.get(product.categoryId) ?? ''}`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }
}
