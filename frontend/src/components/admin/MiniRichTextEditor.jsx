import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

import { uploadBlogImage } from '../../api/client'

function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`min-w-[1.75rem] rounded px-1.5 py-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-neon-blue/20 text-neon-blue font-semibold' : 'text-slate-300 hover:bg-panel-edge/60 hover:text-neon-blue'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-panel-edge" />
}

async function insertImageFile(editor, file) {
  if (!file || !file.type.startsWith('image/')) return
  try {
    const { url } = await uploadBlogImage(file)
    editor.chain().focus().setImage({ src: url }).run()
  } catch {
    // Silent
  }
}

/**
 * Compact mini-rich-text editor specifically for Gutenberg/Elementor paragraph blocks.
 */
export default function MiniRichTextEditor({ value, onChange, placeholder = 'Start typing paragraph...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'markdown-body focus:outline-none min-h-[5rem] px-3 py-2 text-sm text-slate-100' },
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0]
        if (file && file.type.startsWith('image/')) {
          event.preventDefault()
          insertImageFile(editor, file)
          return true
        }
        return false
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((f) => f.type.startsWith('image/'))
        if (file) {
          event.preventDefault()
          insertImageFile(editor, file)
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML())
    },
  })

  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Link URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="rounded border border-panel-edge/80 bg-abyss/40 transition-colors focus-within:border-neon-blue/60">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-panel-edge/60 bg-white/[0.02] px-2 py-1">
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton label="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          {'</>'}
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          &bull; List
        </ToolbarButton>
        <ToolbarButton label="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={addLink}>
          Link
        </ToolbarButton>
        <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
