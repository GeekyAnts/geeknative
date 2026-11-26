/**
 * Realistic starter tasks. Ids are fixed so previews/shots.json and links can point at them.
 * Due dates and timestamps are relative to the day the seed runs, so there are always
 * overdue, due-soon and done tasks.
 */
export const SEED_TASKS = [
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b01',
    title: 'Finalize Q4 product roadmap',
    notes: "Align with the design and engineering leads on the three launch themes. Share the draft in #product before Friday's review.",
    status: 'inProgress',
    priority: 'high',
    dueInDays: 1,
    createdDaysAgo: 6,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b02',
    title: 'Fix crash when uploading large attachments',
    notes: 'Repro: attach a 25 MB PDF on iOS 17. The stack trace is in support ticket #4821. Add a regression test.',
    status: 'todo',
    priority: 'high',
    dueInDays: -1,
    createdDaysAgo: 4,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b03',
    title: 'Interview candidate for senior Android role',
    notes: 'Pairing exercise at 2 pm. The scorecard is in the hiring tracker.',
    status: 'todo',
    priority: 'high',
    dueInDays: 2,
    createdDaysAgo: 3,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b04',
    title: 'Review pull request for the new onboarding flow',
    notes: 'Focus on the empty states and the analytics events.',
    status: 'inProgress',
    priority: 'medium',
    dueInDays: 0,
    createdDaysAgo: 2,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b05',
    title: 'Prepare slides for the all-hands',
    notes: "Ten minutes at most. Cover the beta numbers, two customer quotes and what's next.",
    status: 'todo',
    priority: 'medium',
    dueInDays: 3,
    createdDaysAgo: 5,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b06',
    title: 'Book flights for the Berlin offsite',
    notes: 'Arrive Tuesday evening, leave Friday afternoon. Check the travel policy for the hotel limit.',
    status: 'todo',
    priority: 'medium',
    dueInDays: 7,
    createdDaysAgo: 8,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b07',
    title: 'Plan the customer advisory board meeting',
    notes: 'Draft the agenda, pick a date and send invites to the eight members.',
    status: 'todo',
    priority: 'medium',
    dueInDays: 21,
    createdDaysAgo: 1,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b08',
    title: 'Research analytics vendors',
    notes: 'Compare pricing, data residency options and SDK size for the top three.',
    status: 'inProgress',
    priority: 'low',
    dueInDays: 10,
    createdDaysAgo: 9,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b09',
    title: 'Clean up unused feature flags',
    notes: 'Remove the flags that have been at 100% for over a month.',
    status: 'todo',
    priority: 'low',
    dueInDays: 14,
    createdDaysAgo: 12,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b10',
    title: 'Schedule 1:1s for next week',
    notes: '',
    status: 'todo',
    priority: 'low',
    dueInDays: null,
    createdDaysAgo: 0,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b11',
    title: 'Renew the SSL certificate for staging',
    notes: 'Done through the cloud console. The next renewal reminder is set.',
    status: 'done',
    priority: 'high',
    dueInDays: -3,
    createdDaysAgo: 10,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b12',
    title: 'Write the release notes for 1.4',
    notes: 'Highlight offline mode and the new widgets.',
    status: 'done',
    priority: 'medium',
    dueInDays: -2,
    createdDaysAgo: 7,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b13',
    title: "Update the team's on-call rotation",
    notes: '',
    status: 'done',
    priority: 'low',
    dueInDays: null,
    createdDaysAgo: 11,
  },
  {
    id: '0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b14',
    title: 'Back up the design system Figma file',
    notes: '',
    status: 'done',
    priority: 'low',
    dueInDays: null,
    createdDaysAgo: 13,
  },
]

/** YYYY-MM-DD of a local calendar date. @param {Date} date */
export function localDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Replaces every task with the seed set.
 * @param {import('./task-store.js').TaskStore} store
 * @param {Date} [today]
 */
export function seedTasks(store, today = new Date()) {
  store.clear()
  for (const seed of SEED_TASKS) {
    const due = seed.dueInDays == null ? undefined : new Date(today.getFullYear(), today.getMonth(), today.getDate() + seed.dueInDays)
    const created = new Date(today.getTime() - seed.createdDaysAgo * 86_400_000 - 3_600_000)
    store.create(
      {
        title: seed.title,
        notes: seed.notes,
        status: /** @type {any} */ (seed.status),
        priority: /** @type {any} */ (seed.priority),
        dueDate: due ? localDateString(due) : undefined,
      },
      { id: seed.id, createdAt: created.toISOString() },
    )
  }
  return SEED_TASKS.length
}
