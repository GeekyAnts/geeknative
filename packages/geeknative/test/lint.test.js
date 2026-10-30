import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { lintFindings, textProblem } from '../src/commands/lint.js'
import { parity } from '../src/commands/parity.js'
import { TEMPLATE, tempDir } from './helpers.js'

/** @param {string} root @param {string} file @param {string} content */
function write(root, file, content) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  writeFileSync(path.join(root, file), content)
}

const ORDER_SPEC = (status = 'done') => `---
id: order
title: Order
status:
  ios: ${status}
  android: ${status}
  web: ${status}
---

## Acceptance criteria

- AC-order-1: The order number is shown.

## Test IDs

- \`order.number\`, \`order.total\`: the summary values.
- \`order.line.<productId>\`: a line in the summary.
`

/** A project whose three apps follow every rule. */
function cleanProject() {
  const root = tempDir()
  write(root, 'spec/features/order.md', ORDER_SPEC())
  write(
    root,
    'apps/ios/App/Features/Order/OrderScreen.swift',
    `Text(Strings.orderNumber(id: order.id))
    .accessibilityIdentifier("order.number")
Text(verbatim: "\\(order.total)").accessibilityIdentifier("order.total")
ForEach(order.lines) { line in Row(line).accessibilityIdentifier("order.line.\\(line.productId)") }
Text(verbatim: "🛒") // decorative

#Preview {
    Text("Sample text in a preview is fine")
}
`,
  )
  write(
    root,
    'apps/android/app/src/main/kotlin/app/features/order/OrderScreen.kt',
    `Text(stringResource(R.string.order_number, order.id), modifier = Modifier.testTag("order.number"))
Text("\${order.total}", modifier = Modifier.testTag("order.total"))
Row(Modifier.testTag("order.line.\${line.productId}"))
AnimatedContent(targetState = count, label = "stepper") {}
`,
  )
  write(
    root,
    'apps/web/src/features/order/OrderScreen.tsx',
    `<p data-testid="order.number">{strings.orderNumber({ id })}</p>
<p data-testid="order.total">{total}</p>
{lines.map((line) => <li key={line.productId} data-testid={\`order.line.\${line.productId}\`}>{line.name}</li>)}
const items: Array<Line> = lines
`,
  )
  write(root, 'apps/ios/AppTests/OrderTests.swift', '@Test("AC-order-1: shows the number") func a() { Text("tests can say anything") }')
  write(root, 'apps/android/app/src/test/kotlin/app/OrderTest.kt', 'fun `AC-order-1 shows the number`() {}')
  write(root, 'apps/web/src/features/order/order.test.tsx', "test('AC-order-1: shows the number', () => {})")
  parity(root)
  return root
}

/** @param {string} root */
const summary = (root) => lintFindings(root).map((f) => `${f.level} ${f.rule} ${f.file}${f.line ? `:${f.line}` : ''}`)

test('lint: a project that follows every rule has no findings, and neither does the template', () => {
  assert.deepEqual(summary(cleanProject()), [])
  assert.deepEqual(lintFindings(TEMPLATE), [])
})

test('lint: user-facing text in code is an error on every platform', () => {
  const root = cleanProject()
  write(root, 'apps/ios/App/Features/Order/Line.swift', 'Text(verbatim: "\\(line.name) × \\(line.quantity)")\nButton("Continue") {}\n.navigationTitle("Order")')
  write(root, 'apps/android/app/src/main/kotlin/app/features/order/Line.kt', 'Text("Total")\nIcon(AppIcons.back, contentDescription = "Back")\nText("${name} × ${count}")')
  write(root, 'apps/web/src/features/order/Line.tsx', '<h2>Order summary</h2>\n<button aria-label="Close"><AppIcons.clear /></button>\n<span>{`${name} × ${count}`}</span>')

  const text = lintFindings(root).filter((f) => f.rule === 'text').map((f) => `${f.file}:${f.line}`)
  assert.deepEqual(text.sort(), [
    'apps/android/app/src/main/kotlin/app/features/order/Line.kt:1',
    'apps/android/app/src/main/kotlin/app/features/order/Line.kt:2',
    'apps/android/app/src/main/kotlin/app/features/order/Line.kt:3',
    'apps/ios/App/Features/Order/Line.swift:1',
    'apps/ios/App/Features/Order/Line.swift:2',
    'apps/ios/App/Features/Order/Line.swift:3',
    'apps/web/src/features/order/Line.tsx:1',
    'apps/web/src/features/order/Line.tsx:2',
    'apps/web/src/features/order/Line.tsx:3',
  ])
})

test('lint: TypeScript generics in .ts files are not mistaken for JSX text', () => {
  const root = cleanProject()
  write(root, 'apps/web/src/features/order/Order.ts', 'export const same = (a: Pick<Order, "id">, b: Pick<Order, "id">) => a.id === b.id')
  assert.deepEqual(summary(root), [])
})

test('lint: only preview blocks are skipped, not the code after them', () => {
  const root = cleanProject()
  write(
    root,
    'apps/android/app/src/main/kotlin/app/features/order/Summary.kt',
    '@Preview\n@Composable\nprivate fun SummaryPreview() {\n    AppTheme(darkTheme = false) { Text("Sample") }\n}\n\n@Composable\nfun Footer() {\n    Text("Thanks for ordering")\n}\n',
  )
  write(root, 'apps/ios/App/Features/Order/Summary.swift', '#Preview("Light") {\n    Text("Sample")\n}\n\nstruct Footer: View {\n    var body: some View { Text("Thanks") }\n}\n')
  assert.deepEqual(
    lintFindings(root).filter((f) => f.rule === 'text').map((f) => `${f.file}:${f.line}`),
    ['apps/ios/App/Features/Order/Summary.swift:6', 'apps/android/app/src/main/kotlin/app/features/order/Summary.kt:9'],
  )
})

test('lint: text rules tell words and composed text from values and decoration', () => {
  assert.equal(textProblem('Continue', 'ios'), 'hardcoded text')
  assert.equal(textProblem('\\(name) × \\(count)', 'ios'), 'text composed in code')
  assert.equal(textProblem('₹${price}', 'android'), 'text composed in code')
  assert.equal(textProblem('\\(count)', 'ios'), null)
  assert.equal(textProblem('${total}', 'web'), null)
  assert.equal(textProblem('🛒', 'ios'), null)
})

test('lint: a test ID no spec lists is an error, and a listed one a done app never uses is a warning', () => {
  const root = cleanProject()
  write(root, 'apps/android/app/src/main/kotlin/app/features/order/Extra.kt', 'Modifier.testTag("order.debugPanel")')
  write(root, 'apps/web/src/features/order/OrderScreen.tsx', '<p data-testid="order.number">{n}</p>\n<p data-testid="order.total">{t}</p>')

  const findings = lintFindings(root).filter((f) => f.rule === 'test-id')
  assert.deepEqual(
    findings.map((f) => `${f.level} ${f.file}:${f.line}`),
    ['error apps/android/app/src/main/kotlin/app/features/order/Extra.kt:1', 'warn spec/features/order.md:17'],
  )
  assert.match(findings[0].message, /"order\.debugPanel" isn't listed in any spec/)
  assert.match(findings[1].message, /"order\.line\.<productId>" isn't used in the web app/)
})

test('lint: a fully dynamic prefix still matches a listed ID', () => {
  const root = cleanProject()
  write(root, 'apps/android/app/src/main/kotlin/app/features/order/Stepper.kt', 'Modifier.testTag("$prefix.total")')
  assert.deepEqual(summary(root), [])
})

test('lint: centered screen titles are errors', () => {
  const root = cleanProject()
  write(root, 'apps/ios/App/Features/Order/Title.swift', '.navigationTitle(Strings.orderTitle)\n.navigationBarTitleDisplayMode(.inline)')
  write(root, 'apps/android/app/src/main/kotlin/app/features/order/Title.kt', 'CenterAlignedTopAppBar(title = { Text(stringResource(R.string.order_title)) })')
  assert.deepEqual(
    lintFindings(root).filter((f) => f.rule === 'title').map((f) => `${f.file}:${f.line}`),
    ['apps/ios/App/Features/Order/Title.swift:2', 'apps/android/app/src/main/kotlin/app/features/order/Title.kt:1'],
  )
})

test('lint: a geeknative-ignore comment silences a line', () => {
  const root = cleanProject()
  write(root, 'apps/ios/App/Features/Order/Sheet.swift', '// A sheet keeps the system inline title. geeknative-ignore\n.navigationBarTitleDisplayMode(.inline)\nText("Debug") // geeknative-ignore')
  assert.deepEqual(summary(root), [])
})

test('lint: a "planned" status with tests, and a stale parity.md, are errors', () => {
  const root = cleanProject()
  write(root, 'spec/features/order.md', ORDER_SPEC('planned'))
  const findings = summary(root)
  assert.ok(findings.includes('error status spec/features/order.md'), findings.join('\n'))
  assert.ok(findings.includes('error parity spec/parity.md'), findings.join('\n'))

  parity(root)
  assert.ok(!summary(root).includes('error parity spec/parity.md'), 'make parity fixes it')
})

test('lint: a platform can be linted on its own, without the specs', () => {
  const root = cleanProject()
  write(root, 'apps/web/src/features/order/Line.tsx', '<h2>Order summary</h2>')
  write(root, 'spec/features/order.md', ORDER_SPEC('planned'))
  const iosOnly = lintFindings(root, { platforms: ['ios'], specs: false })
  assert.deepEqual(iosOnly, [])
})

test('lint: uncommitted changes to only some apps are a warning', async () => {
  const { execFileSync } = await import('node:child_process')
  const root = cleanProject()
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' })
  git('init', '-q')
  git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'add', '-A')
  git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-q', '-m', 'start')
  assert.deepEqual(summary(root), [])

  write(root, 'apps/ios/App/Features/Order/OrderScreen.swift', 'Text(Strings.orderTitle).accessibilityIdentifier("order.number")\n.accessibilityIdentifier("order.total")\n.accessibilityIdentifier("order.line.\\(id)")')
  const platforms = lintFindings(root).filter((f) => f.rule === 'platforms')
  assert.equal(platforms.length, 1)
  assert.match(platforms[0].message, /touch ios but not android and web/)
})
