import { createFileRoute } from '@tanstack/react-router'
import { OrderScreen } from '#/features/order/OrderScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/orders/$orderId')({
  head: () => ({ meta: [{ title: `${strings.orderTitle} · ${AppIdentity.name}` }] }),
  component: OrderScreen,
})
