'use client'

import { Fragment, useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import RoleToggle from './RoleToggle'
import { formatPrice } from '@/lib/utils'
import type { Profile, EnrollmentStatus } from '@/types'

interface EnrollmentRow {
  id: string
  status: EnrollmentStatus
  amount_paid_cents: number
  enrolled_at: string
  stripe_payment_intent_id: string | null
  course: { title: string; slug: string } | null
}

export interface UserRow extends Profile {
  enrollments: EnrollmentRow[]
}

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  active: 'Attivo',
  expired: 'Scaduto',
  cancelled: 'Annullato',
}

const dateIt = (s: string) => new Date(s).toLocaleDateString('it-IT')

/** Riga dettaglio: label + valore, "—" se assente */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[16px] text-muted mb-1">{label}</dt>
      <dd className="text-[18px] text-white break-words">{value || '—'}</dd>
    </div>
  )
}

/** Tabella utenti admin con righe espandibili (dettaglio + iscrizioni). */
export default function UsersTable({ users, meId }: { users: UserRow[]; meId?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border text-left text-[13px] text-white/40 uppercase tracking-wide">
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3">Utente</th>
              <th className="px-4 py-3">Azienda</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Iscrizioni</th>
              <th className="px-4 py-3">Registrato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {users.map((user) => {
              const isOpen = expanded === user.id
              return (
                <Fragment key={user.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : user.id)}
                    className="hover:bg-surface-elevated transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-semibold text-xs shrink-0">
                          {user.full_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[16px] text-white">{user.full_name ?? '—'}</p>
                          <p className="text-[14px] text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[16px] text-white/70">{user.company ?? '—'}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RoleToggle userId={user.id} role={user.role} isSelf={user.id === meId} />
                    </td>
                    <td className="px-4 py-3 text-[16px] text-white/70">{user.enrollments.length} corsi</td>
                    <td className="px-4 py-3 text-[15px] text-muted">{dateIt(user.created_at)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="px-6 pb-6 pt-1">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Dati fatturazione + account */}
                          <div>
                            <p className="text-[16px] text-white/70 mb-4">Dati di fatturazione</p>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                              <Field label="Azienda" value={user.company} />
                              <Field label="Sito web" value={user.website} />
                              <Field label="Codice fiscale" value={user.tax_code} />
                              <Field label="Partita IVA" value={user.vat_number} />
                              <Field label="Codice SDI" value={user.sdi_code} />
                              <Field label="Cliente Stripe" value={user.stripe_customer_id} />
                            </dl>
                            <div className="mt-3">
                              <Field label="Indirizzo di fatturazione" value={user.billing_address} />
                            </div>
                          </div>

                          {/* Iscrizioni */}
                          <div>
                            <p className="text-[16px] text-white/70 mb-4">
                              Iscrizioni ({user.enrollments.length})
                            </p>
                            {user.enrollments.length === 0 ? (
                              <p className="text-[16px] text-white/50">Nessuna iscrizione.</p>
                            ) : (
                              <ul className="space-y-2.5">
                                {user.enrollments.map((e) => (
                                  <li key={e.id} className="flex items-center gap-3 text-[16px]">
                                    <span className="flex-1 min-w-0 truncate text-white/80">{e.course?.title ?? '—'}</span>
                                    <span className="text-white/40 shrink-0">{dateIt(e.enrolled_at)}</span>
                                    <span className="text-white/60 shrink-0 w-20 text-right">
                                      {e.amount_paid_cents > 0 ? formatPrice(e.amount_paid_cents) : 'Gratuito'}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-surface-border text-white/50 shrink-0">
                                      {STATUS_LABEL[e.status]}
                                    </span>
                                    {e.stripe_payment_intent_id && (
                                      <a
                                        href={`/api/receipts/${e.stripe_payment_intent_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(ev) => ev.stopPropagation()}
                                        className="text-white/40 hover:text-white transition-colors shrink-0"
                                        title="Apri ricevuta"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">Nessun utente registrato</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
