import { useEffect, useRef, useState, type RefObject } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** True once the window has scrolled more than `threshold` pixels. */
export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const update = () => setPast(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])
  return past
}

/**
 * Hero parallax: the element moves at half the scroll speed and scales up when pulled down past the
 * top. Driven by requestAnimationFrame; off with reduced motion.
 */
export function useParallax<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || reducedMotion()) return
    let frame = 0
    const apply = () => {
      frame = 0
      const y = window.scrollY
      const scale = y < 0 ? 1 + Math.min(-y / 400, 0.3) : 1
      element.style.transform = `translate3d(0, ${Math.max(y, 0) * 0.5}px, 0) scale(${scale})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return ref
}

/** True once the element has scrolled into view (always true without IntersectionObserver). */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

const cssTime = (value: string) => {
  const number = Number.parseFloat(value)
  if (Number.isNaN(number)) return 0
  return value.trim().endsWith('ms') ? number : number * 1000
}

/**
 * Fades and collapses an element out (`duration.normal`, `standard`), then runs `done`. Runs `done`
 * at once with reduced motion or without the Web Animations API.
 */
export function animateOut(element: HTMLElement | null, done: () => void) {
  if (!element || reducedMotion() || typeof element.animate !== 'function') return done()
  const style = getComputedStyle(element)
  const duration = cssTime(style.getPropertyValue('--transition-duration-normal'))
  const easing = style.getPropertyValue('--ease-standard').trim() || 'ease'
  if (duration === 0) return done()
  element.style.overflow = 'hidden'
  const animation = element.animate(
    [
      { opacity: 1, height: `${element.offsetHeight}px`, transform: 'scale(1)' },
      { opacity: 0, height: '0px', transform: 'scale(0.97)', marginTop: '0px', marginBottom: '0px' },
    ],
    { duration, easing, fill: 'forwards' },
  )
  animation.finished.then(done, done)
}

/** The DESIGN.md stagger: `duration.fast / 3` per item, at most 6 items. */
export const staggerDelay = (index: number) => `calc(var(--transition-duration-fast) / 3 * ${Math.min(index, 6)})`
