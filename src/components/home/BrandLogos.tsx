/* eslint-disable @next/next/no-img-element */

// Loghi esportati dal file Figma (già in grigio #989898)
const BRANDS = [
  { name: 'Campari Group', src: '/images/brands/campari.svg', height: 48 },
  { name: 'Pirelli', src: '/images/brands/pirelli.svg', height: 28 },
  { name: 'Ferrero', src: '/images/brands/ferrero.svg', height: 26 },
  { name: 'Bulgari', src: '/images/brands/bulgari.svg', height: 23 },
  { name: 'Coca-Cola', src: '/images/brands/cocacola.svg', height: 54 },
  { name: 'Flextronics', src: '/images/brands/flextronics.svg', height: 25 },
]

export default function BrandLogos() {
  return (
    <section className="bg-surface">
      <div className="bg-[#1B1B1B]">
        <div className="container-wide flex items-center justify-between gap-12 overflow-x-auto h-[169px] scrollbar-hide">
          {BRANDS.map((brand) => (
            <img
              key={brand.name}
              src={brand.src}
              alt={brand.name}
              style={{ height: brand.height }}
              className="shrink-0 w-auto select-none"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
