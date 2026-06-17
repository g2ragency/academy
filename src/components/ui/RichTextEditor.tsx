'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, Link2, List, ListOrdered, Link2Off
} from 'lucide-react'
import { useCallback, useEffect } from 'react'

interface Props {
  value?: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 140 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Scrivi qui...' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content outline-none p-3 text-sm text-white/80 leading-relaxed',
      },
    },
  })

  // Carica il contenuto iniziale quando l'editor è pronto e value cambia dall'esterno
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = editor.getHTML()
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setLink = useCallback(() => {
    const url = window.prompt('Inserisci URL:')
    if (url === null) return
    if (url === '') { editor?.chain().focus().unsetLink().run(); return }
    editor?.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }, [editor])

  const toolBtn = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded transition-colors ${
      active
        ? 'bg-white/20 text-white'
        : 'text-white/40 hover:text-white hover:bg-white/10'
    }`

  if (!editor) return null

  return (
    <div className="input p-0 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-surface-border shrink-0">
        <button type="button" title="Grassetto" onClick={() => editor.chain().focus().toggleBold().run()} className={toolBtn(editor.isActive('bold'))}>
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Corsivo" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolBtn(editor.isActive('italic'))}>
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Sottolineato" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolBtn(editor.isActive('underline'))}>
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Barrato" onClick={() => editor.chain().focus().toggleStrike().run()} className={toolBtn(editor.isActive('strike'))}>
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-surface-border mx-1" />

        <button type="button" title="Inserisci link" onClick={setLink} className={toolBtn(editor.isActive('link'))}>
          <Link2 className="w-3.5 h-3.5" />
        </button>
        {editor.isActive('link') && (
          <button type="button" title="Rimuovi link" onClick={() => editor.chain().focus().unsetLink().run()} className={toolBtn(false)}>
            <Link2Off className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-px h-4 bg-surface-border mx-1" />

        <button type="button" title="Elenco puntato" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolBtn(editor.isActive('bulletList'))}>
          <List className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Elenco numerato" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolBtn(editor.isActive('orderedList'))}>
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Area di testo */}
      <EditorContent editor={editor} style={{ minHeight }} className="overflow-y-auto" />
    </div>
  )
}
