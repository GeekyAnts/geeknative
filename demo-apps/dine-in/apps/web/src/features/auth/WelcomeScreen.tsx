import { Link } from '@tanstack/react-router'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { primaryButtonClass, secondaryButtonClass } from '#/core/designsystem/Buttons'
import { GlassSurface } from '#/core/designsystem/GlassSurface'
import { GoldRule } from '#/core/designsystem/GoldRule'
import { Overline } from '#/core/designsystem/Overline'
import { PhotoScrim } from '#/core/designsystem/PhotoScrim'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { useCatalog } from '#/features/catalog/useCatalog'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export function WelcomeScreen() {
  const { data: catalog } = useCatalog()

  return (
    <main className="relative h-dvh overflow-hidden bg-espresso text-on-glass-on-image">
      {catalog && (
        <RemoteImage
          src={catalog.welcomeImage}
          alt=""
          priority
          className="absolute inset-0 size-full bg-espresso"
          imageClassName="opacity-60 motion-safe:animate-ken-burns"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-espresso/50" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-scrim via-scrim/80 to-transparent" />
      <PhotoScrim />
      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-6xl flex-col gap-sm px-lg pt-[max(var(--spacing-xxl),env(safe-area-inset-top))] md:px-xl">
        <AppSerif role="headline" as="p" className="text-on-glass-on-image">
          {AppIdentity.name}
        </AppSerif>
        <Overline onImage className="font-bold text-on-glass-on-image">
          {strings.brandTagline}
        </Overline>
      </header>
      <GlassSurface
        floating
        strong
        className="absolute inset-x-lg bottom-[max(var(--spacing-lg),env(safe-area-inset-bottom))] z-10 mx-auto flex max-h-[min(72dvh,36rem)] w-full max-w-xl flex-col gap-sm overflow-y-auto rounded-xl p-lg text-on-surface motion-safe:animate-fade-up md:p-xl"
      >
        <Overline>{strings.welcomeOverline}</Overline>
        <GoldRule />
        <AppSerif role="hero" as="h1" className="text-on-surface">
          {strings.welcomeTitle}
        </AppSerif>
        <p className="text-body text-on-surface-variant">{strings.welcomeBody}</p>
        <div className="flex flex-col gap-sm">
          <Link to="/sign-up" data-testid="welcome.createAccount" className={`${primaryButtonClass} w-full`}>
            {strings.welcomeCreateAccount}
          </Link>
          <Link to="/sign-in" data-testid="welcome.signIn" className={`${secondaryButtonClass} w-full`}>
            {strings.welcomeSignIn}
          </Link>
        </div>
      </GlassSurface>
    </main>
  )
}
