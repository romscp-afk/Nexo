import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/silver-legacy-logo.png'
import { EVENT } from '@/features/gathering/lib/eventConfig'
import '@/features/gathering/styles/gathering-intro.css'

const THANK_BODY =
  'Your details have been received. We look forward to reconnecting with you and keeping our friendship alive until we meet again in Galle.'

const TICKER_ITEMS = [
  'THANK YOU',
  EVENT.batch,
  EVENT.title,
  EVENT.tagline,
  EVENT.date,
  EVENT.venue,
  'SEE YOU SOON',
]

function TickerContent() {
  const line = TICKER_ITEMS.join('  ◆  ')
  return (
    <>
      <span>{line}  ◆  </span>
      <span aria-hidden>{line}  ◆  </span>
    </>
  )
}

export function GatheringThankYouPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromSubmit = Boolean((location.state as { fromSubmit?: boolean } | null)?.fromSubmit)

  const [flashing, setFlashing] = useState(fromSubmit)
  const [cursorHover, setCursorHover] = useState(false)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const ringPos = useRef({ x: 0, y: 0 })
  const mousePos = useRef({ x: 0, y: 0 })
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!fromSubmit) return
    const timer = window.setTimeout(() => setFlashing(false), 650)
    return () => window.clearTimeout(timer)
  }, [fromSubmit])

  const goHome = useCallback(() => {
    setFlashing(true)
    window.setTimeout(() => navigate('/contact'), 650)
  }, [navigate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') goHome()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goHome])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    if (reducedMotion || coarsePointer) return

    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`
        dotRef.current.style.top = `${e.clientY}px`
      }
    }

    const animateRing = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`
        ringRef.current.style.top = `${ringPos.current.y}px`
      }
      frameRef.current = requestAnimationFrame(animateRing)
    }

    window.addEventListener('mousemove', onMove)
    frameRef.current = requestAnimationFrame(animateRing)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <div className="legacy-intro font-[Raleway,sans-serif]">
      <div aria-hidden className="legacy-intro__grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="legacy-intro__glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="legacy-intro__vignette pointer-events-none absolute inset-0" />

      <div className="legacy-intro__cursor pointer-events-none fixed inset-0 z-[100] hidden md:block">
        <div ref={dotRef} className="legacy-intro__cursor-dot fixed left-0 top-0" />
        <div
          ref={ringRef}
          className={`legacy-intro__cursor-ring fixed left-0 top-0 ${cursorHover ? 'legacy-intro__cursor-ring--hover' : ''}`}
        />
      </div>

      <div
        aria-hidden
        className={`legacy-intro__flash fixed inset-0 z-[90] ${flashing ? 'legacy-intro__flash--active' : ''}`}
      />

      <nav className="legacy-intro__phase legacy-intro__phase--1 absolute left-0 right-0 top-0 z-20 flex items-start justify-between px-6 py-6 sm:px-10 sm:py-8">
        <span className="font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.35em] text-[#f4f0e8]/45">
          Received
        </span>
        <span className="font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.35em] text-[#c9a96e]/70">
          ✓ Confirmed
        </span>
      </nav>

      <div aria-hidden className="legacy-intro__phase legacy-intro__phase--1 pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="legacy-intro__ring legacy-intro__ring--1" />
        <div className="legacy-intro__ring legacy-intro__ring--2" />
        <div className="legacy-intro__ring legacy-intro__ring--3" />
      </div>

      <main className="legacy-intro__main relative z-10 flex h-full flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-16 text-center sm:px-10">
        <div className="legacy-intro__phase legacy-intro__phase--2 relative mb-8 sm:mb-10">
          <img
            src={logoUrl}
            alt={`${EVENT.title} — ${EVENT.tagline}`}
            className="mx-auto h-auto w-full max-w-[min(340px,85vw)] object-contain drop-shadow-[0_4px_32px_rgba(201,169,110,0.2)] sm:max-w-md"
          />
        </div>

        <div className="legacy-intro__phase legacy-intro__phase--2 max-w-4xl">
          <h1 className="font-[Playfair_Display,serif] text-[clamp(2.8rem,10vw,6rem)] leading-[0.92] tracking-[-0.02em] text-[#f4f0e8]">
            <span className="block font-normal not-italic">Thank</span>
            <span className="block font-normal italic text-[#c9a96e]">you</span>
          </h1>
        </div>

        <div className="legacy-intro__phase legacy-intro__phase--3 mt-8 w-full max-w-md sm:max-w-lg">
          <div className="legacy-intro__hairline mb-6" />
          <p className="text-sm font-light leading-relaxed tracking-wide text-[#f4f0e8]/75 sm:text-base">
            {THANK_BODY}
          </p>
          <div className="legacy-intro__hairline mt-6" />
          <p className="mt-5 font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.4em] text-[#c9a96e]/70">
            {EVENT.tagline}
          </p>
          <p className="mt-2 font-[DM_Mono,monospace] text-[10px] tracking-[0.25em] text-[#f4f0e8]/35">
            {EVENT.date} · {EVENT.venue}
          </p>
        </div>

        <div className="legacy-intro__phase legacy-intro__phase--4 mt-10 sm:mt-12">
          <button
            type="button"
            onClick={goHome}
            onMouseEnter={() => setCursorHover(true)}
            onMouseLeave={() => setCursorHover(false)}
            className="legacy-intro__enter px-12 py-4 font-[DM_Mono,monospace] text-xs uppercase tracking-[0.55em] sm:px-16 sm:py-5 sm:text-sm"
          >
            <span className="legacy-intro__enter-label">Return</span>
          </button>
          <p className="mt-5 font-[DM_Mono,monospace] text-[9px] uppercase tracking-[0.3em] text-[#f4f0e8]/30">
            Until we meet again
          </p>
        </div>
      </main>

      <div className="legacy-intro__phase legacy-intro__phase--4 legacy-intro__ticker-bar">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="legacy-intro__ticker-track font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.35em] text-[#c9a96e]/55">
            <TickerContent />
          </div>
        </div>
      </div>
    </div>
  )
}
