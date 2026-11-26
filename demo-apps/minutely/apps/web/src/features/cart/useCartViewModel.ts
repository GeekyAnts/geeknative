import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { AppContainer } from '#/core/AppContainer'
import type { Product } from '#/features/catalog/Catalog'
import { buildOrder, type Order } from '#/features/order/Order'
import { orderQuery } from '#/features/order/useOrderViewModel'
import { AppConfig } from '#/generated/config'
import { cartSummary } from './CartSummary'
import { changeCart, useCart } from './useCart'

/**
 * Builds an Order from the current cart, saves it, and empties the cart (spec/features/cart.md).
 * `container.clock` sets `placedAt`, so tests can fix the order id.
 */
export async function placeOrder(
  queryClient: QueryClient,
  container: Pick<AppContainer, 'cartRepository' | 'catalogRepository' | 'ordersRepository' | 'clock'>,
): Promise<Order> {
  const { cartRepository, catalogRepository, ordersRepository, clock } = container
  const product = (id: string) => catalogRepository.product(id)
  const lines = await cartRepository.lines()
  const order = buildOrder(lines, cartSummary(lines, product), product, clock())
  await ordersRepository.save(order)
  queryClient.setQueryData(orderQuery(ordersRepository, order.id).queryKey, order)
  await changeCart(queryClient, cartRepository, (cart) => cart.clear())
  return order
}

export interface CartItem {
  product: Product
  quantity: number
  linePrice: number
  lineMrp: number
}

/** State and actions for the Cart screen. */
export function useCartViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const cart = useCart()
  const [isPlacing, setPlacing] = useState(false)
  // A ref as well as state: a double click arrives before React re-renders the disabled button.
  const placing = useRef(false)

  const items = cart.lines.flatMap((line): CartItem[] => {
    const product = container.catalogRepository.product(line.productId)
    if (!product) return []
    return [{ product, quantity: line.quantity, linePrice: product.price * line.quantity, lineMrp: product.mrp * line.quantity }]
  })

  return {
    ready: cart.ready,
    items,
    summary: cart.summary,
    freeDeliveryThreshold: AppConfig.freeDeliveryThreshold,
    /** How far the item total is toward free delivery, from 0 to 1. */
    freeDeliveryProgress: Math.min(1, cart.summary.itemTotal / AppConfig.freeDeliveryThreshold),
    isPlacing,
    placeOrder: async () => {
      if (placing.current) return
      placing.current = true
      setPlacing(true)
      try {
        const order = await placeOrder(queryClient, container)
        // Order placed replaces Cart, so Back returns to where the customer was before Cart.
        await navigate({ to: '/orders/$orderId', params: { orderId: order.id }, replace: true })
      } finally {
        placing.current = false
        setPlacing(false)
      }
    },
  }
}
