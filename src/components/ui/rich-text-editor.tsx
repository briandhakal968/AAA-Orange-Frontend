"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, memo } from "react";

const EditorArea = memo(({ editor }: { editor: any }) => {
  if (!editor) return null;
  return <EditorContent editor={editor} />;
});
EditorArea.displayName = "EditorArea";

export function RichTextEditor({ value, onChange, placeholder = "Write your content...", height = 300 }: { value: string; onChange: (v: string) => void; placeholder?: string; height?: number }) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div style={{ minHeight: height }} className="border border-slate-200 rounded-lg" />;
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white" style={{ minHeight: height }}>
      <EditorArea editor={editor} />
    </div>
  );
}
