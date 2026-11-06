import { emptyWeddingPlan, type Enquiry, type WeddingPlan } from '#/features/catalog/types'

export type WeddingRepository = {
  getPlan(): Promise<WeddingPlan>
  savePlan(plan: WeddingPlan): Promise<WeddingPlan>
  getEnquiries(): Promise<Enquiry[]>
  addEnquiry(enquiry: Enquiry): Promise<Enquiry[]>
}

export function mergePlan(base: WeddingPlan, patch: Partial<WeddingPlan>): WeddingPlan {
  return { ...base, ...patch }
}

export function withToggledId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

export function parsePlan(raw: string | null): WeddingPlan {
  if (!raw) return { ...emptyWeddingPlan }
  try {
    const parsed = JSON.parse(raw) as Partial<WeddingPlan>
    return { ...emptyWeddingPlan, ...parsed, guestCount: parsed.guestCount || emptyWeddingPlan.guestCount }
  } catch {
    return { ...emptyWeddingPlan }
  }
}

export function parseEnquiries(raw: string | null): Enquiry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Enquiry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
