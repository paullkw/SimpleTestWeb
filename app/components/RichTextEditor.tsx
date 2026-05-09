"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          editor.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex gap-1 border-b border-zinc-300 bg-white p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("bold")
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("italic")
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("heading", { level: 2 })
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("bulletList")
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("orderedList")
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Ordered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className="rounded px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          title="Insert Image"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded px-2 py-1 text-sm font-medium ${
            editor.isActive("codeBlock")
              ? "bg-orange-100 text-orange-900"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Code Block"
        >
          &lt;&gt;
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="min-h-[120px] w-full rounded-b-lg border border-t-0 border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus-within:border-orange-400 focus-within:ring-2"
      />
    </div>
  );
}
