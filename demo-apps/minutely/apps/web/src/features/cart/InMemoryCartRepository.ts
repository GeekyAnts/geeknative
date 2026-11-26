import { addLine, removeLine, type CartLine, type CartRepository } from './CartRepository'

/** Keeps the cart in memory only. For tests and previews: nothing survives a restart. */
export class InMemoryCartRepository implements CartRepository {
  private current: CartLine[]

  constructor(lines: CartLine[] = []) {
    this.current = [...lines]
  }

  async lines(): Promise<CartLine[]> {
    return [...this.current]
  }

  async quantity(productId: string): Promise<number> {
    return this.current.find((line) => line.productId === productId)?.quantity ?? 0
  }

  async add(productId: string): Promise<CartLine[]> {
    this.current = addLine(this.current, productId)
    return [...this.current]
  }

  async remove(productId: string): Promise<CartLine[]> {
    this.current = removeLine(this.current, productId)
    return [...this.current]
  }

  async clear(): Promise<CartLine[]> {
    this.current = []
    return []
  }
}
