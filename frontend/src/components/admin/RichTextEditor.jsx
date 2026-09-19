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
      className={`min-w-[2rem] rounded px-2 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-neon-blue/10 text-neon-blue' : 'text-slate-300 hover:bg-panel-edge/60 hover:text-neon-blue'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-panel-edge" />
}

// Uploads a dropped/pasted/picked file and inserts it at the cursor. Silent
// on failure — there's no toast system here, and a failed inline image
// upload just means nothing gets inserted, which is self-evident to the author.
async function insertImageFile(editor, file) {
  if (!file || !file.type.startsWith('image/')) return
  try {
    const { url } = await uploadBlogImage(file)
    editor.chain().focus().setImage({ src: url }).run()
  } catch {
    // See comment above.
  }
}

/**
 * WYSIWYG rich-text editor (TipTap/ProseMirror) for blog post content.
 * Outputs HTML via `onChange` — rendered on the public site by
 * components/RichTextContent.jsx, which sanitizes it with DOMPurify.
 */
export default function RichTextEditor({ value, onChange, id = 'content' }) {
  const editor = useEditor({
    extensions: [
      // TipTap v3's StarterKit already bundles Link — configuring it through
      // StarterKit's own `link` option (rather than adding a separate Link
      // extension) avoids a "duplicate extension" registration.
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
      Image,
      Placeholder.configure({ placeholder: 'Write your post…' }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'markdown-body focus:outline-none min-h-96' },
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
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  // Loading an existing post fetches its content asynchronously, after the
  // editor has already mounted with the initial (empty) value — sync it once
  // the real content arrives. Guarded by the equality check so this never
  // fights the user's own typing (onUpdate already keeps `value` and the
  // editor's own HTML in lockstep on every keystroke).
  useEffect(() => {
    // React 19 (and StrictMode generally) can mount/destroy/remount an
    // effect's editor instance; calling methods on an already-destroyed one
    // throws deep inside ProseMirror rather than failing gracefully.
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => insertImageFile(editor, input.files?.[0])
    input.click()
  }

  return (
    <div>
      <label htmlFor={id} className="system-heading mb-2 block text-xs text-slate-400">
        Content
      </label>

      <div className="rounded-md border border-panel-edge bg-abyss/40">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-panel-edge p-1.5">
          <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            {'</>'}
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            label="Heading 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            &bull; List
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1. List
          </ToolbarButton>
          <ToolbarButton label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            &ldquo;&rdquo;
          </ToolbarButton>
          <ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            {'{ }'}
          </ToolbarButton>
          <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            &mdash;
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Link" active={editor.isActive('link')} onClick={addLink}>
            Link
          </ToolbarButton>
          <ToolbarButton label="Insert image" onClick={addImage}>
            Image
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            &#8630;
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            &#8631;
          </ToolbarButton>
        </div>

        <div className="p-4">
          <EditorContent editor={editor} id={id} />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Drag and drop, or paste, an image directly into the content to insert it.
      </p>
    </div>
  )
}
