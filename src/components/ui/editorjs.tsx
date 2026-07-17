"use client";

import { TiptapEditor } from "./tiptap-editor";

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function RichTextInput({
  value,
  onChange,
  placeholder = "Write something...",
}: RichTextInputProps) {
  return (
    <TiptapEditor
      content={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
