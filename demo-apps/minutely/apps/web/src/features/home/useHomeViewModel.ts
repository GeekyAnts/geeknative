import { useRouteContext } from '@tanstack/react-router'
import { AppConfig } from '#/generated/config'
import { strings } from '#/generated/strings'

/** State for the Home screen. The catalog is local, so there are no loading or error states. */
export function useHomeViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  return {
    deliveryPromise: strings.commonDeliveryIn({ minutes: AppConfig.deliveryMinutes }),
    deliveryAddress: strings.commonDeliveryAddress,
    bannerBody: strings.homeBannerBody({ amount: AppConfig.freeDeliveryThreshold }),
    categories: container.catalogRepository.categories(),
    bestsellers: container.catalogRepository.bestsellers(),
  }
}
