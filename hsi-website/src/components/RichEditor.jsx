import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

export default function RichEditor({
  value,
  onChange,
  placeholder = "Tulis...",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[220px] focus:outline-none px-3 py-2",
      },
    },
  });

  // ✅ SYNC: kalau parent value berubah (mis. klik Edit), update isi editor
  useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML() || "";
    const incoming = value || "";

    // hindari loop: hanya setContent jika beda
    if (current !== incoming) {
      editor.commands.setContent(incoming, false); // false = jangan push history
    }
  }, [editor, value]);

  if (!editor)
    return <div className="p-3 text-sm text-gray-500">Loading editor...</div>;

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b bg-gray-50 p-2">
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Number
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => {
            const url = prompt("Link URL");
            if (!url) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          Unlink
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="px-3 py-2 text-xs text-gray-500 border-t">
        {placeholder}
      </div>
    </div>
  );
}
