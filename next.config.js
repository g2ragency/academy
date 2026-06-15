// Header di sicurezza applicati a tutte le risposte (difesa in profondità).
// NB: niente Content-Security-Policy stretta qui — va testata con cura per
// non rompere script inline di Next, Supabase, Stripe ed embed YouTube.
const securityHeaders = [
  // Anti-clickjacking: il sito non può essere messo in un <iframe> esterno
  { key: 'X-Frame-Options', value: 'DENY' },
  // Impedisce il MIME-sniffing del browser
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Non perde l'URL completo come referrer verso altri siti
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disabilita API potenti che il sito non usa
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Forza HTTPS per 2 anni (Vercel serve già in HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
