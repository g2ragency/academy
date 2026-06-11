const BRANDS = [
  'Ampari Group',
  'Pirelli',
  'Ferrero',
  'Bulgari',
  'Coca-Cola',
  'Flextra',
  'Mapei',
  'Brembo',
]

export default function BrandLogos() {
  return (
    <section className="py-10 border-y border-surface-border bg-surface overflow-hidden">
      <div className="container-wide">
        <div className="flex items-center gap-12 overflow-x-auto pb-2 scrollbar-hide">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="shrink-0 text-lg font-bold text-white/20 hover:text-white/40 transition-colors select-none tracking-tight"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
