import type { JSX, SVGProps } from 'react'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { AmenityId, CollectionId, CuisineId, Dietary, Occasion, Seating } from './Catalog'

export type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element

/** User-facing labels and icons for catalog enums (`cuisine.<id>`, `amenity.<id>`, ...). */

export function cuisineLabel(id: CuisineId): string {
  const labels: Record<CuisineId, string> = {
    italian: strings.cuisineItalian,
    japanese: strings.cuisineJapanese,
    indian: strings.cuisineIndian,
    french: strings.cuisineFrench,
    mediterranean: strings.cuisineMediterranean,
    asian: strings.cuisineAsian,
    continental: strings.cuisineContinental,
  }
  return labels[id]
}

export function collectionTitle(id: CollectionId): string {
  const titles: Record<CollectionId, string> = {
    mostLoved: strings.collectionMostLovedTitle,
    fineDining: strings.collectionFineDiningTitle,
    romantic: strings.collectionRomanticTitle,
    rooftop: strings.collectionRooftopTitle,
    hiddenGems: strings.collectionHiddenGemsTitle,
    chefsPicks: strings.collectionChefsPicksTitle,
  }
  return titles[id]
}

export function collectionSubtitle(id: CollectionId): string {
  const subtitles: Record<CollectionId, string> = {
    mostLoved: strings.collectionMostLovedSubtitle,
    fineDining: strings.collectionFineDiningSubtitle,
    romantic: strings.collectionRomanticSubtitle,
    rooftop: strings.collectionRooftopSubtitle,
    hiddenGems: strings.collectionHiddenGemsSubtitle,
    chefsPicks: strings.collectionChefsPicksSubtitle,
  }
  return subtitles[id]
}

export function amenityLabel(id: AmenityId): string {
  const labels: Record<AmenityId, string> = {
    valet: strings.amenityValet,
    sommelier: strings.amenitySommelier,
    privateDining: strings.amenityPrivateDining,
    liveMusic: strings.amenityLiveMusic,
    rooftop: strings.amenityRooftop,
    accessible: strings.amenityAccessible,
    bar: strings.amenityBar,
    chefsTable: strings.amenityChefsTable,
    garden: strings.amenityGarden,
    wifi: strings.amenityWifi,
  }
  return labels[id]
}

export const amenityIcon: Record<AmenityId, IconComponent> = {
  valet: AppIcons.amenityValet,
  sommelier: AppIcons.amenitySommelier,
  privateDining: AppIcons.amenityPrivateDining,
  liveMusic: AppIcons.amenityLiveMusic,
  rooftop: AppIcons.amenityRooftop,
  accessible: AppIcons.amenityAccessible,
  bar: AppIcons.amenityBar,
  chefsTable: AppIcons.amenityChefsTable,
  garden: AppIcons.amenityGarden,
  wifi: AppIcons.amenityWifi,
}

export function seatingLabel(id: Seating): string {
  const labels: Record<Seating, string> = {
    indoor: strings.seatingIndoor,
    outdoor: strings.seatingOutdoor,
    window: strings.seatingWindow,
    private: strings.seatingPrivate,
  }
  return labels[id]
}

export const seatingIcon: Record<Seating, IconComponent> = {
  indoor: AppIcons.seatingIndoor,
  outdoor: AppIcons.seatingOutdoor,
  window: AppIcons.seatingWindow,
  private: AppIcons.seatingPrivate,
}

export function occasionLabel(id: Occasion): string {
  const labels: Record<Occasion, string> = {
    none: strings.occasionNone,
    birthday: strings.occasionBirthday,
    anniversary: strings.occasionAnniversary,
    business: strings.occasionBusiness,
    date: strings.occasionDate,
    celebration: strings.occasionCelebration,
  }
  return labels[id]
}

export const occasionIcon: Record<Occasion, IconComponent | undefined> = {
  none: undefined,
  birthday: AppIcons.occasionBirthday,
  anniversary: AppIcons.occasionAnniversary,
  business: AppIcons.occasionBusiness,
  date: AppIcons.occasionDate,
  celebration: AppIcons.occasionCelebration,
}

export function dietaryLabel(id: Dietary): string {
  const labels: Record<Dietary, string> = {
    vegetarian: strings.dietaryVegetarian,
    vegan: strings.dietaryVegan,
    glutenFree: strings.dietaryGlutenFree,
    dairyFree: strings.dietaryDairyFree,
    nutAllergy: strings.dietaryNutAllergy,
    shellfishAllergy: strings.dietaryShellfishAllergy,
  }
  return labels[id]
}

export function availabilityLabel(availability: 'available' | 'full' | 'closed'): string {
  switch (availability) {
    case 'available':
      return strings.restaurantAvailabilityAvailable
    case 'full':
      return strings.restaurantAvailabilityFull
    case 'closed':
      return strings.restaurantAvailabilityClosed
  }
}
