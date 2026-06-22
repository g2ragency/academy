/* eslint-disable @next/next/no-img-element */

// Loghi esportati dal file Figma (già in grigio #989898).
// Altezze del Figma desktop (heightDesktop). Su mobile la striscia è più
// piccola: i loghi vengono scalati proporzionalmente con un'altezza in rem
// che usa clamp() — un solo valore copre mobile→desktop.
const BRANDS = [
  { name: 'Campari Group', src: '/images/brands/campari.svg', heightDesktop: 48 },
  { name: 'Pirelli', src: '/images/brands/pirelli.svg', heightDesktop: 28 },
  { name: 'Ferrero', src: '/images/brands/ferrero.svg', heightDesktop: 26 },
  { name: 'Bulgari', src: '/images/brands/bulgari.svg', heightDesktop: 23 },
  { name: 'Coca-Cola', src: '/images/brands/cocacola.svg', heightDesktop: 54 },
  { name: 'Flextronics', src: '/images/brands/flextronics.svg', heightDesktop: 25 },
]

export default function BrandLogos() {
  return (
    <section className="bg-surface">
      <div className="relative bg-card overflow-hidden">
        <div className="container-wide flex items-center justify-between gap-8 md:gap-12 overflow-x-auto h-20 md:h-[169px] scrollbar-hide">
          {BRANDS.map((brand) => (
            <img
              key={brand.name}
              src={brand.src}
              alt={brand.name}
              // ~57% di scala su mobile (h~80) → 100% da md (h169)
              style={{ height: `clamp(${Math.round(brand.heightDesktop * 0.57)}px, ${(brand.heightDesktop * 0.57 / 16).toFixed(3)}rem + ${((brand.heightDesktop - brand.heightDesktop * 0.57) / 8.87).toFixed(2)}vw, ${brand.heightDesktop}px)` }}
              className="shrink-0 w-auto select-none"
            />
          ))}
        </div>
        {/* Sfumatura nera ai bordi (Figma): i bordi della striscia vanno al
            nero pieno e i loghi vi svaniscono dentro, non tagliati di netto */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-surface to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-surface to-transparent" />
      </div>
    </section>
  )
}
