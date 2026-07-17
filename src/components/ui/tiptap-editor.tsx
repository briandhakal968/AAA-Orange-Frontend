"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './tiptap-image-extension';
import { useEffect, useState } from 'react';
import { MediaPicker } from '@/components/admin/media-picker';
import { useTypography } from '@/hooks/use-typography';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder = "Start writing..." }: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const { typography, loading } = useTypography();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply typography styles to editor
  useEffect(() => {
    if (!loading && typography) {
      const styleId = 'tiptap-typography-styles';
      let styleEl = document.getElementById(styleId);
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
       styleEl.textContent = `
         .tiptap-editor h1 { font-size: ${typography.h1.font_size}px; line-height: ${typography.h1.line_height}; margin-bottom: ${typography.h1.margin_bottom}px; font-family: ${typography.h1.font_family}; color: ${typography.h1.color}; font-weight: ${typography.h1.font_weight}; }
         .tiptap-editor h2 { font-size: ${typography.h2.font_size}px; line-height: ${typography.h2.line_height}; margin-bottom: ${typography.h2.margin_bottom}px; font-family: ${typography.h2.font_family}; color: ${typography.h2.color}; font-weight: ${typography.h2.font_weight}; }
         .tiptap-editor h3 { font-size: ${typography.h3.font_size}px; line-height: ${typography.h3.line_height}; margin-bottom: ${typography.h3.margin_bottom}px; font-family: ${typography.h3.font_family}; color: ${typography.h3.color}; font-weight: ${typography.h3.font_weight}; }
         .tiptap-editor h4 { font-size: ${typography.h4.font_size}px; line-height: ${typography.h4.line_height}; margin-bottom: ${typography.h4.margin_bottom}px; font-family: ${typography.h4.font_family}; color: ${typography.h4.color}; font-weight: ${typography.h4.font_weight}; }
         .tiptap-editor h5 { font-size: ${typography.h5.font_size}px; line-height: ${typography.h5.line_height}; margin-bottom: ${typography.h5.margin_bottom}px; font-family: ${typography.h5.font_family}; color: ${typography.h5.color}; font-weight: ${typography.h5.font_weight}; }
         .tiptap-editor h6 { font-size: ${typography.h6.font_size}px; line-height: ${typography.h6.line_height}; margin-bottom: ${typography.h6.margin_bottom}px; font-family: ${typography.h6.font_family}; color: ${typography.h6.color}; font-weight: ${typography.h6.font_weight}; }
         .tiptap-editor p { font-size: ${typography.paragraph.font_size}px; line-height: ${typography.paragraph.line_height}; margin-bottom: ${typography.paragraph.margin_bottom}px; font-family: ${typography.paragraph.font_family}; color: ${typography.paragraph.color}; font-weight: ${typography.paragraph.font_weight}; }
         .tiptap-editor ul, .tiptap-editor ol { line-height: 0.8; padding-left: 1em; margin-bottom: 15px; }
         .tiptap-editor li { line-height: 0.8; }
         .tiptap-editor li p { margin-bottom: 0; }
       `;
    }
  }, [typography, loading]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] p-4',
      },
    },
    immediatelyRender: false, // Fix SSR issue
  });

  // Update editor content when prop changes (for initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!mounted) {
    return <div className="border rounded-lg p-4 min-h-[200px] bg-slate-50 animate-pulse" />;
  }

  if (!editor) {
    return <div className="border rounded-lg p-4 min-h-[200px] bg-slate-50 animate-pulse" />;
  }

  return (
    <div className="tiptap-editor border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-slate-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('bold') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('italic') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('strike') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Strike
        </button>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('paragraph') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Paragraph
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 1 }) 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 3 }) 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          >
           H3
         </button>
         <button
           type="button"
           onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
           className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
             editor.isActive('heading', { level: 4 }) 
               ? 'bg-indigo-100 text-indigo-700' 
               : 'bg-white text-slate-700 hover:bg-slate-100'
           }`}
         >
           H4
         </button>
         <button
           type="button"
           onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
           className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
             editor.isActive('heading', { level: 5 }) 
               ? 'bg-indigo-100 text-indigo-700' 
               : 'bg-white text-slate-700 hover:bg-slate-100'
           }`}
         >
           H5
         </button>
         <button
           type="button"
           onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
           className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
             editor.isActive('heading', { level: 6 }) 
               ? 'bg-indigo-100 text-indigo-700' 
               : 'bg-white text-slate-700 hover:bg-slate-100'
           }`}
         >
           H6
         </button>
         
         <div className="w-px h-6 bg-slate-300 mx-1" />
         
         <button
           type="button"
           onClick={() => setShowMediaPicker(true)}
           className="px-3 py-1 rounded text-sm font-medium bg-white text-slate-700 hover:bg-slate-100 transition-colors"
         >
           🖼️ Image
         </button>
         
         {showMediaPicker && (
           <MediaPicker
             isOpen={showMediaPicker}
             onClose={() => setShowMediaPicker(false)}
              onSelect={(url: string) => {
                editor.chain().focus().insertContent(`<img src="${url}" />`).run();
                setShowMediaPicker(false);
              }}
           />
         )}
         
         <div className="w-px h-6 bg-slate-300 mx-1" />
         
         <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('bulletList') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          • Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('orderedList') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          1. Numbered List
        </button>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('blockquote') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1 rounded text-sm font-medium bg-white text-slate-700 hover:bg-slate-100 transition-colors"
        >
          ― HR
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
