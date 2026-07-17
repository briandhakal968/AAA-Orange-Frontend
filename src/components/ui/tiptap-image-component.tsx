import { NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { NodeViewProps } from '@tiptap/react';

interface ImageComponentProps {
  node: NodeViewProps['node'];
  updateAttributes: (attrs: Record<string, any>) => void;
  editor: any;
  getPos: () => number | undefined;
}

export function ImageComponent({ node, editor, getPos }: ImageComponentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Delete this image?')) {
      const pos = getPos();
      if (pos === undefined) return;
      const { state, view } = editor;
      const tr = state.tr.delete(pos - 1, pos + 1);
      view.dispatch(tr);
    }
  };

  return (
    <NodeViewWrapper 
      className="tiptap-image-wrapper relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className="max-w-full h-auto rounded-lg"
      />
      {isHovered && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg transition-opacity"
          title="Delete image"
        >
          ×
        </button>
      )}
    </NodeViewWrapper>
  );
}
