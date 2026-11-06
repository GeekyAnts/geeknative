import { createFileRoute } from '@tanstack/react-router'
import { HomeScreen } from '#/features/home/HomeScreen'

export const Route = createFileRoute('/')({
  component: HomeScreen,
})
