import Testing
@testable import App

@MainActor
@Suite("Catalog")
struct CatalogTests {
    let catalog = LocalCatalogRepository()

    @Test("AC-catalog-1: has the 6 categories in order, with exact fields")
    func categories() {
        let expected: [(String, String, String)] = [
            ("fruits", "Fruits & Vegetables", "🥦"),
            ("dairy", "Dairy, Bread & Eggs", "🥛"),
            ("snacks", "Snacks & Munchies", "🍿"),
            ("drinks", "Cold Drinks & Juices", "🧃"),
            ("household", "Cleaning Essentials", "🧽"),
            ("personal", "Personal Care", "🧴"),
        ]
        let actual = catalog.categories().map { ($0.id, $0.name, $0.emoji) }
        #expect(actual.count == 6)
        #expect(actual.map(\.0) == expected.map(\.0))
        #expect(actual.map(\.1) == expected.map(\.1))
        #expect(actual.map(\.2) == expected.map(\.2))
    }

    @Test("AC-catalog-1: has the 30 products in order, with exact fields")
    func products() {
        // id | name | unit | price | mrp | emoji | categoryId | bestseller, from spec/features/catalog.md.
        let table = """
        banana|Robusta Banana|6 pcs|49|60|🍌|fruits|yes
        apple|Shimla Apple|4 pcs|129|160|🍎|fruits|yes
        tomato|Hybrid Tomato|500 g|24|30|🍅|fruits|no
        avocado|Hass Avocado|1 pc|149|199|🥑|fruits|no
        carrot|Ooty Carrot|500 g|39|45|🥕|fruits|no
        milk|Toned Milk|500 ml|28|28|🥛|dairy|yes
        eggs|Farm Fresh Eggs|6 pcs|54|60|🥚|dairy|no
        bread|Whole Wheat Bread|400 g|45|50|🍞|dairy|yes
        cheese|Cheese Slices|200 g|135|150|🧀|dairy|no
        butter|Salted Butter|100 g|58|60|🧈|dairy|no
        chips|Classic Salted Chips|52 g|20|20|🍟|snacks|no
        popcorn|Butter Popcorn|90 g|45|55|🍿|snacks|no
        cookies|Choco Chip Cookies|150 g|60|75|🍪|snacks|yes
        chocolate|Dark Chocolate 70%|100 g|175|199|🍫|snacks|yes
        pretzels|Salted Pretzels|100 g|99|120|🥨|snacks|no
        cola|Cola Can|300 ml|40|40|🥤|drinks|no
        orange-juice|Fresh Orange Juice|1 L|125|150|🍊|drinks|yes
        coconut-water|Tender Coconut Water|200 ml|55|60|🥥|drinks|no
        cold-brew|Cold Brew Coffee|250 ml|120|150|☕|drinks|no
        water|Mineral Water|1 L|20|20|💧|drinks|no
        sponges|Scrub Sponges|3 pcs|49|60|🧽|household|no
        detergent|Liquid Detergent|1 L|199|249|🫧|household|yes
        kitchen-towels|Kitchen Towels|2 rolls|89|110|🧻|household|no
        broom|Soft Broom|1 pc|149|199|🧹|household|no
        garbage-bags|Garbage Bags|30 pcs|79|99|🗑️|household|no
        toothpaste|Herbal Toothpaste|150 g|95|110|🪥|personal|no
        shampoo|Daily Shampoo|340 ml|245|299|🧴|personal|no
        soap|Moisturising Soap|4 × 100 g|160|200|🧼|personal|yes
        lip-balm|Lip Balm|4.5 g|99|125|💄|personal|no
        razor|Classic Razor|1 pc|149|175|🪒|personal|no
        """
        let expected = table.split(separator: "\n").map(String.init)
        let actual = catalog.categories()
            .flatMap { catalog.products(categoryId: $0.id) }
            .map { "\($0.id)|\($0.name)|\($0.unit)|\($0.price)|\($0.mrp)|\($0.emoji)|\($0.categoryId)|\($0.isBestseller ? "yes" : "no")" }
        #expect(actual.count == 30)
        #expect(actual == expected)
        #expect(LocalCatalogRepository.productData.map(\.id) == expected.map { String($0.split(separator: "|")[0]) })
        #expect(catalog.product(id: "milk")?.name == "Toned Milk")
        #expect(catalog.product(id: "nope") == nil)
    }

    @Test("AC-catalog-2: discount is (mrp - price) * 100 / mrp rounded down, none when MRP equals price")
    func discount() {
        #expect(catalog.product(id: "banana")?.discountPercent == 18) // 11 * 100 / 60 = 18.33
        #expect(catalog.product(id: "apple")?.discountPercent == 19) // 3100 / 160 = 19.375
        #expect(catalog.product(id: "avocado")?.discountPercent == 25) // 5000 / 199 = 25.1
        #expect(catalog.product(id: "butter")?.discountPercent == 3) // 200 / 60 = 3.33
        let milk = catalog.product(id: "milk")!
        #expect(milk.discountPercent == 0)
        #expect(!milk.hasDiscount)
        #expect(catalog.product(id: "banana")!.hasDiscount)
    }

    @Test("AC-catalog-3: bestsellers() returns the 9 bestsellers in catalog order")
    func bestsellers() {
        #expect(catalog.bestsellers().map(\.id) == [
            "banana", "apple", "milk", "bread", "cookies", "chocolate", "orange-juice", "detergent", "soap",
        ])
    }

    @Test("AC-catalog-4: Category lists exactly the chosen category's products, and a chip switches it")
    func categoryScreen() {
        let router = Router(path: [.category(categoryId: "dairy")])
        let viewModel = CategoryViewModel(categoryId: "dairy", catalog: catalog, cart: InMemoryCartRepository(), router: router)
        #expect(viewModel.title == "Dairy, Bread & Eggs")
        #expect(viewModel.products.map(\.id) == ["milk", "eggs", "bread", "cheese", "butter"])
        #expect(viewModel.categories.count == 6)

        viewModel.select("drinks")
        #expect(viewModel.selectedCategoryId == "drinks")
        #expect(viewModel.products.map(\.id) == ["cola", "orange-juice", "coconut-water", "cold-brew", "water"])
        // Switching doesn't push a new screen.
        #expect(router.path == [.category(categoryId: "dairy")])
    }

    @Test("AC-catalog-4: an unknown category id shows the first category")
    func unknownCategory() {
        let viewModel = CategoryViewModel(categoryId: "toys", catalog: catalog, cart: InMemoryCartRepository(), router: Router())
        #expect(viewModel.selectedCategoryId == "fruits")
        #expect(viewModel.products.count == 5)
    }

    @Test("AC-catalog-5: Add puts one in the cart and the card then shows the stepper with 1")
    func addFromCard() {
        let cart = InMemoryCartRepository()
        #expect(!QuantityStepper.showsCount(quantity: cart.quantity(of: "banana")))

        cart.add("banana") // what the card's Add button does

        #expect(cart.lines == [CartLine(productId: "banana", quantity: 1)])
        #expect(cart.quantity(of: "banana") == 1)
        #expect(QuantityStepper.showsCount(quantity: cart.quantity(of: "banana")))
    }
}
