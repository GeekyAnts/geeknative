import { Outlet, createFileRoute } from '@tanstack/react-router'
import { TabBar } from '#/core/designsystem/TabBar'

/** The five tab roots with the floating glass tab bar. Pushed screens are sibling routes without it. */
export const Route = createFileRoute('/_tabs')({
  component: TabsLayout,
})

function TabsLayout() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <TabBar />
    </>
  )
}
