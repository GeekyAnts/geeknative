import { createFileRoute } from '@tanstack/react-router'
import { CartScreen } from '#/features/cart/CartScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: `${strings.cartTitle} · ${AppIdentity.name}` }] }),
  component: CartScreen,
})
