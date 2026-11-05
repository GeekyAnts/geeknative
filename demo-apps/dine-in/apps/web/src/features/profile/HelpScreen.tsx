import { useId, useState } from 'react'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { focusRing } from '#/core/designsystem/Buttons'
import { Page } from '#/core/designsystem/Page'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { TopBar } from '#/core/designsystem/TopBar'
import type { IconComponent } from '#/features/catalog/Labels'
import { telUrl } from '#/features/reservation/CalendarEvent'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

const faqs = [
  { id: 'modify', question: strings.helpFaqModifyQuestion, answer: strings.helpFaqModifyAnswer },
  { id: 'cancel', question: strings.helpFaqCancelQuestion, answer: strings.helpFaqCancelAnswer },
  { id: 'demo', question: strings.helpFaqDemoQuestion, answer: strings.helpFaqDemoAnswer },
] as const

export function HelpScreen() {
  return (
    <div className="min-h-dvh">
      <TopBar title={strings.helpTitle} fallback="/profile" />
      <Page width="form">
        <ScreenHeader title={strings.helpTitle} subtitle={strings.helpBody} />
        <ul className="flex flex-col divide-y divide-outline/40 overflow-hidden rounded-lg bg-surface shadow-low motion-safe:animate-fade-up">
          <ContactRow icon={AppIcons.mail} label={strings.helpEmail} detail={strings.helpEmailAddress} href={`mailto:${strings.helpEmailAddress}`} testId="help.email" />
          <ContactRow icon={AppIcons.phone} label={strings.helpCall} detail={strings.helpPhoneNumber} href={telUrl(strings.helpPhoneNumber)} testId="help.call" />
        </ul>
        <section className="flex flex-col gap-md">
          <AppSerif role="title" as="h2" className="text-on-background">
            {strings.helpFaqTitle}
          </AppSerif>
          <div className="flex flex-col gap-sm">
            {faqs.map((faq) => (
              <FaqItem key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>
      </Page>
    </div>
  )
}

function ContactRow({ icon: Icon, label, detail, href, testId }: { icon: IconComponent; label: string; detail: string; href: string; testId: string }) {
  return (
    <li>
      <a href={href} data-testid={testId} className={`flex min-h-touch-target items-center gap-md px-lg py-md hover:bg-surface-variant ${focusRing} focus-visible:-outline-offset-2`}>
        <span className="flex size-touch-target shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon className="size-icon-md" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-subtitle text-on-surface">{label}</span>
          <span className="truncate text-caption text-on-surface-variant">{detail}</span>
        </span>
        <AppIcons.chevronRight className="size-icon-sm text-on-surface-variant rtl:-scale-x-100" />
      </a>
    </li>
  )
}

function FaqItem({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-low">
      <button
        type="button"
        data-testid={`help.faq.${id}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-touch-target w-full items-center justify-between gap-md px-lg py-md text-start text-subtitle text-on-surface ${focusRing} focus-visible:-outline-offset-2`}
      >
        {question}
        <AppIcons.chevronDown
          className={`size-icon-sm shrink-0 text-on-surface-variant motion-safe:transition-transform motion-safe:duration-snappy motion-safe:ease-snappy ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-hidden={!open}
        className={`grid motion-safe:transition-all motion-safe:duration-snappy motion-safe:ease-snappy ${open ? 'grid-rows-expanded opacity-100' : 'grid-rows-collapsed opacity-0'}`}
      >
        <p className="min-h-0 overflow-hidden px-lg text-body text-on-surface-variant">
          <span className="block pb-lg">{answer}</span>
        </p>
      </div>
    </div>
  )
}
