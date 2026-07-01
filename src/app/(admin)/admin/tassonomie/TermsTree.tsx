'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Check, X, ChevronUp, ChevronDown, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { buildTermTree } from '@/lib/taxonomy'
import type { Term } from '@/types'

interface Props {
  taxonomyId: string
  initialTerms: Term[]
}

/**
 * Albero delle voci di una tassonomia: categorie (radice) e sottocategorie
 * (un livello di profondità). CRUD inline + riordino con frecce su sort_order.
 */
export default function TermsTree({ taxonomyId, initialTerms }: Props) {
  const [terms, setTerms] = useState<Term[]>(initialTerms)
  const supabase = createClient()
  const tree = buildTermTree(terms)

  const addTerm = async (name: string, parentId: string | null) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    const siblings = terms.filter((t) => (t.parent_id ?? null) === parentId)
    const { data, error } = await supabase
      .from('terms')
      .insert({
        taxonomy_id: taxonomyId,
        parent_id: parentId,
        name: trimmed,
        slug: slugify(trimmed),
        sort_order: siblings.length,
      })
      .select()
      .single()
    if (error) {
      toast.error(error.code === '23505' ? 'Esiste già una voce con questo nome' : error.message)
      return false
    }
    setTerms((prev) => [...prev, data as Term])
    return true
  }

  const renameTerm = async (term: Term, name: string) => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === term.name) return true
    const { error } = await supabase
      .from('terms')
      .update({ name: trimmed, slug: slugify(trimmed) })
      .eq('id', term.id)
    if (error) {
      toast.error(error.code === '23505' ? 'Esiste già una voce con questo nome' : error.message)
      return false
    }
    setTerms((prev) => prev.map((t) => (t.id === term.id ? { ...t, name: trimmed, slug: slugify(trimmed) } : t)))
    return true
  }

  const deleteTerm = async (term: Term) => {
    const hasChildren = terms.some((t) => t.parent_id === term.id)
    if (!confirm(hasChildren
      ? `Eliminare "${term.name}" e tutte le sue sottocategorie?`
      : `Eliminare "${term.name}"?`)) return
    const { error } = await supabase.from('terms').delete().eq('id', term.id)
    if (error) { toast.error(error.message); return }
    setTerms((prev) => prev.filter((t) => t.id !== term.id && t.parent_id !== term.id))
  }

  const moveTerm = async (term: Term, direction: -1 | 1) => {
    const siblings = terms
      .filter((t) => (t.parent_id ?? null) === (term.parent_id ?? null))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    const index = siblings.findIndex((t) => t.id === term.id)
    const swapWith = siblings[index + direction]
    if (!swapWith) return
    // normalizza i sort_order all'indice di lista per rendere lo swap affidabile
    const updates = siblings.map((t, i) => ({
      id: t.id,
      sort_order: t.id === term.id ? index + direction : t.id === swapWith.id ? index : i,
    }))
    const { error } = await supabase.from('terms').upsert(
      updates.map((u) => {
        const original = terms.find((t) => t.id === u.id)!
        return { ...original, sort_order: u.sort_order, children: undefined }
      })
    )
    if (error) { toast.error(error.message); return }
    setTerms((prev) => prev.map((t) => {
      const u = updates.find((x) => x.id === t.id)
      return u ? { ...t, sort_order: u.sort_order } : t
    }))
  }

  return (
    <div className="space-y-1">
      {tree.length === 0 && (
        <p className="text-[16px] text-white/30 pb-2">Nessuna voce: aggiungi la prima categoria qui sotto.</p>
      )}
      {tree.map((root) => (
        <div key={root.id}>
          <TermRow term={root} onRename={renameTerm} onDelete={deleteTerm} onMove={moveTerm} onAddChild={addTerm} />
          {root.children?.map((child) => (
            <TermRow key={child.id} term={child} depth={1} onRename={renameTerm} onDelete={deleteTerm} onMove={moveTerm} />
          ))}
        </div>
      ))}
      <AddTermInput placeholder="Nuova categoria…" onAdd={(name) => addTerm(name, null)} />
    </div>
  )
}

function TermRow({ term, depth = 0, onRename, onDelete, onMove, onAddChild }: {
  term: Term
  depth?: number
  onRename: (term: Term, name: string) => Promise<boolean>
  onDelete: (term: Term) => void
  onMove: (term: Term, direction: -1 | 1) => void
  onAddChild?: (name: string, parentId: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(term.name)
  const [addingChild, setAddingChild] = useState(false)

  const submitRename = async () => {
    if (await onRename(term, name)) setEditing(false)
  }

  return (
    <>
      <div className={`group flex items-center gap-2 py-1.5 rounded-lg px-2 hover:bg-surface-elevated transition-colors ${depth ? 'ml-7' : ''}`}>
        {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-white/20 shrink-0" />}
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input py-1.5 flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename()
                if (e.key === 'Escape') { setName(term.name); setEditing(false) }
              }}
            />
            <button onClick={submitRename} className="p-1 text-white/40 hover:text-white"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setName(term.name); setEditing(false) }} className="p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </>
        ) : (
          <>
            <span className="text-[16px] text-white/80 flex-1">{term.name}</span>
            <span className="text-[14px] text-white/20">{term.slug}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onMove(term, -1)} title="Sposta su" className="p-1 text-white/30 hover:text-white"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => onMove(term, 1)} title="Sposta giù" className="p-1 text-white/30 hover:text-white"><ChevronDown className="w-3.5 h-3.5" /></button>
              {onAddChild && (
                <button onClick={() => setAddingChild(true)} title="Aggiungi sottocategoria" className="p-1 text-white/30 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
              )}
              <button onClick={() => setEditing(true)} title="Rinomina" className="p-1 text-white/30 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(term)} title="Elimina" className="p-1 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </>
        )}
      </div>
      {addingChild && onAddChild && (
        <div className="ml-7">
          <AddTermInput
            placeholder={`Sottocategoria di "${term.name}"…`}
            autoFocus
            onAdd={(name) => onAddChild(name, term.id)}
            onDone={() => setAddingChild(false)}
          />
        </div>
      )}
    </>
  )
}

function AddTermInput({ placeholder, onAdd, onDone, autoFocus }: {
  placeholder: string
  onAdd: (name: string) => Promise<boolean>
  onDone?: () => void
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!value.trim()) { onDone?.(); return }
    setSaving(true)
    const ok = await onAdd(value)
    setSaving(false)
    if (ok) { setValue(''); onDone?.() }
  }

  return (
    <div className="flex items-center gap-2 pt-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={saving}
        className="input text-sm py-1.5 flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setValue(''); onDone?.() }
        }}
      />
      <button onClick={submit} disabled={saving} className="p-1.5 text-white/40 hover:text-white disabled:opacity-40">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
