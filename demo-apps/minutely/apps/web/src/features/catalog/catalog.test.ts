import { describe, expect, test } from 'vitest'
import { discountPercent } from './Catalog'
import { LocalCatalogRepository } from './LocalCatalogRepository'

const catalog = new LocalCatalogRepository()

describe('Catalog', () => {
  test('AC-catalog-1: has the 6 categories and 30 products, in order, with their exact fields', () => {
    expect(catalog.categories()).toEqual([
      { id: 'fruits', name: 'Fruits & Vegetables', emoji: '🥦' },
      { id: 'dairy', name: 'Dairy, Bread & Eggs', emoji: '🥛' },
      { id: 'snacks', name: 'Snacks & Munchies', emoji: '🍿' },
      { id: 'drinks', name: 'Cold Drinks & Juices', emoji: '🧃' },
      { id: 'household', name: 'Cleaning Essentials', emoji: '🧽' },
      { id: 'personal', name: 'Personal Care', emoji: '🧴' },
    ])
    const all = catalog.categories().flatMap((category) => catalog.products(category.id))
    expect(all).toHaveLength(30)
    expect(all.map((product) => product.id)).toEqual([
      'banana', 'apple', 'tomato', 'avocado', 'carrot',
      'milk', 'eggs', 'bread', 'cheese', 'butter',
      'chips', 'popcorn', 'cookies', 'chocolate', 'pretzels',
      'cola', 'orange-juice', 'coconut-water', 'cold-brew', 'water',
      'sponges', 'detergent', 'kitchen-towels', 'broom', 'garbage-bags',
      'toothpaste', 'shampoo', 'soap', 'lip-balm', 'razor',
    ])
    expect(catalog.product('banana')).toEqual({
      id: 'banana', name: 'Robusta Banana', unit: '6 pcs', price: 49, mrp: 60, emoji: '🍌', categoryId: 'fruits', isBestseller: true,
    })
    expect(catalog.product('soap')).toEqual({
      id: 'soap', name: 'Moisturising Soap', unit: '4 × 100 g', price: 160, mrp: 200, emoji: '🧼', categoryId: 'personal', isBestseller: true,
    })
    expect(catalog.product('garbage-bags')).toEqual({
      id: 'garbage-bags', name: 'Garbage Bags', unit: '30 pcs', price: 79, mrp: 99, emoji: '🗑️', categoryId: 'household', isBestseller: false,
    })
    expect(catalog.product('nope')).toBeUndefined()
    for (const product of all) expect(product.mrp).toBeGreaterThanOrEqual(product.price)
  })

  test('AC-catalog-2: discount is (mrp - price) * 100 / mrp rounded down, none when MRP equals price', () => {
    expect(discountPercent(catalog.product('banana')!)).toBe(18) // 11 * 100 / 60 = 18.33
    expect(discountPercent(catalog.product('chocolate')!)).toBe(12) // 24 * 100 / 199 = 12.06
    expect(discountPercent(catalog.product('avocado')!)).toBe(25)
    expect(discountPercent(catalog.product('milk')!)).toBe(0)
    expect(discountPercent(catalog.product('cola')!)).toBe(0)
  })

  test('AC-catalog-3: bestsellers() returns the 9 bestsellers in catalog order', () => {
    expect(catalog.bestsellers().map((product) => product.id)).toEqual([
      'banana', 'apple', 'milk', 'bread', 'cookies', 'chocolate', 'orange-juice', 'detergent', 'soap',
    ])
  })
})
