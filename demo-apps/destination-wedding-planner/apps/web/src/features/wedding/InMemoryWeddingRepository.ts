import { emptyWeddingPlan, type Enquiry, type WeddingPlan } from '#/features/catalog/types'
import type { WeddingRepository } from './WeddingRepository'

export class InMemoryWeddingRepository implements WeddingRepository {
  private plan: WeddingPlan
  private enquiries: Enquiry[]

  constructor(plan: WeddingPlan = { ...emptyWeddingPlan }, enquiries: Enquiry[] = []) {
    this.plan = { ...plan }
    this.enquiries = [...enquiries]
  }

  async getPlan(): Promise<WeddingPlan> {
    return { ...this.plan, savedDestinationIds: [...this.plan.savedDestinationIds], savedVenueIds: [...this.plan.savedVenueIds], completedTaskIds: [...this.plan.completedTaskIds], selectedExperienceIds: [...this.plan.selectedExperienceIds] }
  }

  async savePlan(plan: WeddingPlan): Promise<WeddingPlan> {
    this.plan = { ...plan }
    return this.getPlan()
  }

  async getEnquiries(): Promise<Enquiry[]> {
    return [...this.enquiries]
  }

  async addEnquiry(enquiry: Enquiry): Promise<Enquiry[]> {
    this.enquiries = [...this.enquiries, enquiry]
    return this.getEnquiries()
  }
}
