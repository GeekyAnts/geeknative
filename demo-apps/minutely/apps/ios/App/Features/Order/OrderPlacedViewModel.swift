import Observation

/// State and actions for Order placed.
@Observable
final class OrderPlacedViewModel {
    /// The four steps of the static status timeline.
    enum StepState: Equatable { case done, current, pending }

    struct Step: Identifiable, Equatable {
        let title: String
        let state: StepState
        var id: String { title }
    }

    @ObservationIgnored private let router: Router
    let orderId: String
    /// nil when no order has this id (the not-found state).
    let order: Order?

    init(orderId: String, orders: any OrdersRepository, router: Router) {
        self.orderId = orderId
        self.router = router
        order = orders.order(id: orderId)
    }

    convenience init(orderId: String, container: AppContainer) {
        self.init(orderId: orderId, orders: container.ordersRepository, router: container.router)
    }

    var numberText: String { Strings.orderNumber(id: orderId) }

    var deliveryText: String { Strings.orderPlacedBody(minutes: AppConfig.deliveryMinutes) }

    var itemCountText: String { Strings.commonItemCount(count: order?.itemCount ?? 0) }

    var totalText: String { Strings.commonPrice(amount: order?.toPay ?? 0) }

    /// A summary line's name and quantity (`order.lineQuantity`).
    func lineText(_ line: OrderLine) -> String {
        Strings.orderLineQuantity(name: line.name, count: line.quantity)
    }

    let steps: [Step] = [
        Step(title: Strings.orderStepConfirmed, state: .done),
        Step(title: Strings.orderStepPacking, state: .current),
        Step(title: Strings.orderStepOnTheWay, state: .pending),
        Step(title: Strings.orderStepDelivered, state: .pending),
    ]

    /// Back to Home, clearing the stack.
    func continueShopping() { router.popToRoot() }
}
