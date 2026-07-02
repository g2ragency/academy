'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMediaUrl } from '@/lib/media'

export type HeroCourse = {
  id: string
  slug: string
  title: string
  thumbnail_url: string | null
}

// Path estratti da card-hero.svg (viewBox 0 0 440 394):
// WHITE_RIM = faccia bianca (rim che sporge), GREY_FACE = faccia grigia (superficie)
const WHITE_RIM =
  'M391.872 75.0102L76.237 7.51982C43.0706 0.425461 26.4874 -3.12667 15.465 5.78828C4.45239 14.7032 4.45239 31.6525 4.45239 65.5709V257.94C4.45239 280.945 4.45239 292.452 11.052 300.615C17.6517 308.778 28.9017 311.182 51.4018 315.991L367.036 383.481C400.203 390.576 416.786 394.118 427.799 385.213C438.821 376.298 438.821 359.348 438.821 325.43V133.061C438.821 110.057 438.821 98.5492 432.221 90.3863C425.622 82.2233 414.372 79.8189 391.872 75.0102Z'
const GREY_FACE =
  'M387.914 77.9984L72.2792 10.508C39.1129 3.41361 22.5297 -0.128624 11.5072 8.78632C0.494629 17.6914 0.494629 34.6506 0.494629 68.559V260.928C0.494629 283.933 0.494629 295.44 7.09426 303.603C13.6939 311.766 24.9439 314.17 47.444 318.979L363.079 386.469C396.245 393.564 412.828 397.106 423.841 388.201C434.863 379.286 434.863 362.337 434.863 328.418V136.049C434.863 113.045 434.863 101.537 428.264 93.3744C421.664 85.2115 410.414 82.8071 387.914 77.9984Z'

const N = 20 // totale card (+2 davanti e +2 dietro rispetto a prima, tutte fuori view)
const LEAD_NEUTRAL = 4 // card neutre davanti ai corsi reali (stesso passo uniforme)
const ASPECT = 394 / 440
const DESIGN_VW = 1150 // schermo di riferimento per la scala (più basso = card più grandi ovunque)
const BLEED_BOTTOM = 461 // px di card che escono sotto la view (+121 = +2 step, per assorbire le 2 nuove card davanti senza spostare le altre)
const BLEED_TOP = 121 // px di card che escono sopra la view (+121 = +2 step, per le 2 nuove card dietro)

const ENTER_STAGGER_MS = 50 // ritardo tra una card e la successiva in ingresso

function Card({ course, i, cardW, transform, z }: {
  course: HeroCourse | null
  i: number
  cardW: number
  transform: string
  z: number
}) {
  const thumb = course ? getMediaUrl(course.thumbnail_url) : null
  const height = cardW * ASPECT
  const clipId = `hc-clip-${i}`
  const gradId = `hc-grad-${i}`
  // le card vicine all'angolo in alto a destra (indici alti, già quasi lì)
  // arrivano per prime; quelle davanti (indice 0, più lontane) arrivano per ultime
  const delay = (N - 1 - i) * ENTER_STAGGER_MS
  const layerStyle = { '--rest': transform, '--hc-delay': `${delay}ms`, zIndex: z } as React.CSSProperties

  return (
    <div className="hc-enter">
      {/* zona-hit STAZIONARIA (solo corsi reali): cattura hover/clic restando ferma */}
      {course && (
        <Link href={`/corsi/${course.slug}`} className="hc-hitzone" style={layerStyle} aria-label={course.title}>
          <svg viewBox="0 0 440 394" style={{ width: cardW, height }} fill="none" aria-hidden>
            <path d={GREY_FACE} className="hc-hitpath" fill="transparent" />
          </svg>
        </Link>
      )}

      {/* card VISIVA: si alza all'hover, non intercetta il mouse */}
      <div className="hc-visual" style={layerStyle} aria-hidden>
        <svg viewBox="0 0 440 394" style={{ width: cardW, height }} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#adacab" />
              <stop offset="1" stopColor="#7f7e7d" />
            </linearGradient>
            <clipPath id={clipId}>
              <path d={GREY_FACE} />
            </clipPath>
          </defs>
          <path d={WHITE_RIM} fill="#F4F3F3" />
          <path d={GREY_FACE} fill={`url(#${gradId})`} />
          {thumb && (
            <image
              href={thumb}
              x="0"
              y="0"
              width="440"
              height="394"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
          )}
        </svg>
        {course && (
          /* targhetta a destra (come da reference) */
          <span className="hc-tag" style={{ top: '38%', right: -22 }}>
            {course.title}
          </span>
        )}
      </div>
    </div>
  )
}

/** Stack di card 3D nella hero (desktop), responsive e con bleed sopra/sotto.
 *  Non renderizza nulla finché non conosce le dimensioni reali della finestra:
 *  prima si vedeva uno scatto (le card comparivano con la size "indovinata"
 *  DESIGN_VW/900 e poi saltavano a quella corretta). Ora restano assenti finché
 *  non si conosce la size vera, poi entrano con l'animazione (mai nel posto
 *  sbagliato). */
export default function HeroCardStack({ courses }: { courses: HeroCourse[] }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!size) return <div className="hc-stack" />

  // fattore responsive (dimensione/spread orizzontale) sulla larghezza
  const f = Math.min(2.3, Math.max(0.78, size.w / DESIGN_VW))
  const cardW = 440 * f
  const cardH = cardW * ASPECT
  const lift = cardH * 0.32 // hover: ~1/3 dell'altezza

  const frontX = -100 * f
  const stepX = 55 * f // ~55px equidistanti (ridotto: a 90 l'ultima card usciva già oltre il bordo destro molto prima di arrivare in alto)
  const stepScale = 0.045

  // verticale legato all'altezza viewport → front esce SOTTO, back esce SOPRA.
  // shiftLast compensa lo scale (origin center) che sposta in giù il top delle
  // card lontane, così l'ultima card esce davvero sopra di BLEED_TOP.
  const frontY = size.h - cardH + BLEED_BOTTOM
  const shiftLast = (cardH * (N - 1) * stepScale) / 2
  const stepY = (frontY + BLEED_TOP + shiftLast) / (N - 1)

  const rest = (i: number) =>
    `translate(${frontX + i * stepX}px, ${frontY - i * stepY}px) scale(${1 - i * stepScale})`

  // LEAD_NEUTRAL card neutre davanti, poi i corsi reali, poi neutre decorative dietro
  const slots: (HeroCourse | null)[] = Array.from({ length: N }, (_, i) => {
    const ci = i - LEAD_NEUTRAL
    return ci >= 0 ? courses[ci] ?? null : null
  })

  return (
    <div className="hc-stack" style={{ '--hc-lift': `${lift}px` } as React.CSSProperties}>
      {slots.map((course, i) => (
        <Card key={course?.id ?? `n-${i}`} course={course} i={i} cardW={cardW} transform={rest(i)} z={N - i} />
      ))}
    </div>
  )
}
