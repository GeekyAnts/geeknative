import type { CatalogRepository } from '#/features/catalog/CatalogRepository'
import { CART_STORAGE_KEY, addLine, parseCartLines, removeLine, type CartLine, type CartRepository } from './CartRepository'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * Keeps the cart in the browser's localStorage under `cart.items`, as
 * `[{"productId":"banana","quantity":2}]`. Without storage (during server rendering) the cart is empty.
 */
export class LocalStorageCartRepository implements CartRepository {
  private readonly storage: KeyValueStorage | undefined
  private readonly catalog: CatalogRepository

  constructor(storage: KeyValueStorage | undefined, catalog: CatalogRepository) {
    this.storage = storage
    this.catalog = catalog
  }

  private read(): CartLine[] {
    let json: string | null | undefined
    try {
      json = this.storage?.getItem(CART_STORAGE_KEY)
    } catch {
      return []
    }
    return parseCartLines(json, (productId) => this.catalog.product(productId) !== undefined)
  }

  private write(lines: CartLine[]): CartLine[] {
    try {
      this.storage?.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(lines.map(({ productId, quantity }) => ({ productId, quantity }))),
      )
    } catch {
      // Storage full or blocked: the cart still works for this page.
    }
    return lines
  }

  async lines(): Promise<CartLine[]> {
    return this.read()
  }

  async quantity(productId: string): Promise<number> {
    return this.read().find((line) => line.productId === productId)?.quantity ?? 0
  }

  async add(productId: string): Promise<CartLine[]> {
    return this.write(addLine(this.read(), productId))
  }

  async remove(productId: string): Promise<CartLine[]> {
    return this.write(removeLine(this.read(), productId))
  }

  async clear(): Promise<CartLine[]> {
    return this.write([])
  }
}
