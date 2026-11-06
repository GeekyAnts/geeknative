import { ENQUIRIES_STORAGE_KEY, PLAN_STORAGE_KEY, type Enquiry, type WeddingPlan } from '#/features/catalog/types'
import { parseEnquiries, parsePlan, type WeddingRepository } from './WeddingRepository'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export class LocalStorageWeddingRepository implements WeddingRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async getPlan(): Promise<WeddingPlan> {
    return parsePlan(this.storage?.getItem(PLAN_STORAGE_KEY) ?? null)
  }

  async savePlan(plan: WeddingPlan): Promise<WeddingPlan> {
    this.storage?.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan))
    return plan
  }

  async getEnquiries(): Promise<Enquiry[]> {
    return parseEnquiries(this.storage?.getItem(ENQUIRIES_STORAGE_KEY) ?? null)
  }

  async addEnquiry(enquiry: Enquiry): Promise<Enquiry[]> {
    const next = [...(await this.getEnquiries()), enquiry]
    this.storage?.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(next))
    return next
  }
}
