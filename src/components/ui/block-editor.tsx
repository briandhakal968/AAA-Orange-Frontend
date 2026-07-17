"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Quote,
  Minus,
  Square,
  Columns,
  Video,
  Code,
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Undo,
  Redo,
  Search,
  X,
  Settings,
} from "lucide-react";
import MediaLibraryModal from "./media-library-modal";

type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "image"
  | "list"
  | "orderedList"
  | "quote"
  | "separator"
  | "spacer"
  | "columns"
  | "button"
  | "video"
  | "code"
  | "html";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  attributes: Record<string, any>;
}

interface BlockDefinition {
  type: BlockType;
  name: string;
  icon: React.ElementType;
  category: string;
  description: string;
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "paragraph", name: "Paragraph", icon: Type, category: "Text", description: "Start with a block of text" },
  { type: "heading1", name: "Heading 1", icon: Heading1, category: "Text", description: "Large section heading" },
  { type: "heading2", name: "Heading 2", icon: Heading2, category: "Text", description: "Medium section heading" },
  { type: "heading3", name: "Heading 3", icon: Heading3, category: "Text", description: "Small section heading" },
  { type: "list", name: "Bullet List", icon: List, category: "Text", description: "Create a bulleted list" },
  { type: "orderedList", name: "Numbered List", icon: ListOrdered, category: "Text", description: "Create a numbered list" },
  { type: "quote", name: "Quote", icon: Quote, category: "Text", description: "Give quoted text visual emphasis" },
  { type: "code", name: "Code", icon: Code, category: "Text", description: "Display code snippets" },
  { type: "image", name: "Image", icon: Image, category: "Media", description: "Add an image from library or URL" },
  { type: "video", name: "Video", icon: Video, category: "Media", description: "Embed a video" },
  { type: "separator", name: "Separator", icon: Minus, category: "Layout", description: "Add a horizontal dividing line" },
  { type: "spacer", name: "Spacer", icon: Square, category: "Layout", description: "Add white space between blocks" },
  { type: "columns", name: "Columns", icon: Columns, category: "Layout", description: "Display content in columns" },
  { type: "button", name: "Button", icon: Square, category: "Layout", description: "Add a call-to-action button" },
  { type: "html", name: "Custom HTML", icon: Code, category: "Advanced", description: "Add custom HTML code" },
];

const CATEGORIES = ["Text", "Media", "Layout", "Advanced"];

function generateId() {
  return "block-" + Math.random().toString(36).substr(2, 9);
}

// Clean list content: extract only LI elements and remove Quill formatting
function cleanListContent(html: string): string {
  if (!html) return '';
  
  // Remove outer OL/UL wrapper tags (Quill format wraps content in OL)
  let cleaned = html;
  
  // Remove opening tags at the start
  cleaned = cleaned.replace(/^<ol[^>]*>/i, '');
  cleaned = cleaned.replace(/^<ul[^>]*>/i, '');
  
  // Remove closing tags at the end
  cleaned = cleaned.replace(/<\/ol>\s*$/i, '');
  cleaned = cleaned.replace(/<\/ul>\s*$/i, '');
  
  // Also handle cases where there might be multiple wrappers
  // Extract all LI elements using regex
  const liMatches = cleaned.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    cleaned = liMatches.join('');
  }
  
  // Remove Quill-specific attributes and elements
  cleaned = cleaned.replace(/data-list="bullet"/gi, '');
  cleaned = cleaned.replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
  
  return cleaned;
}

function htmlToBlocks(html: string): Block[] {
  if (!html || html.trim() === "") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: Block[] = [];

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({ id: generateId(), type: "paragraph", content: text, attributes: {} });
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    
    if (tag === "h1") blocks.push({ id: generateId(), type: "heading1", content: el.innerHTML, attributes: {} });
    else if (tag === "h2") blocks.push({ id: generateId(), type: "heading2", content: el.innerHTML, attributes: {} });
    else if (tag === "h3") blocks.push({ id: generateId(), type: "heading3", content: el.innerHTML, attributes: {} });
    else if (tag === "p") blocks.push({ id: generateId(), type: "paragraph", content: el.innerHTML, attributes: {} });
    else if (tag === "ul") {
      // Extract LI elements from UL (block content should only be LI elements)
      const liElements = Array.from(el.children)
        .filter(child => child.tagName.toLowerCase() === 'li')
        .map(li => {
          // Clean Quill attributes from each LI
          const liEl = li as HTMLElement;
          return liEl.outerHTML
            .replace(/data-list="bullet"/gi, '')
            .replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
        })
        .join('');
      blocks.push({ id: generateId(), type: "list", content: liElements, attributes: {} });
    }
    else if (tag === "ol") {
      // Check if this is actually a bullet list (Quill format uses ol with data-list="bullet")
      const isBulletList = el.querySelector('li[data-list="bullet"]') || el.getAttribute('data-list') === 'bullet';
      if (isBulletList) {
        // Convert to bullet list - extract LI elements
        const liElements = Array.from(el.children)
          .filter(child => child.tagName.toLowerCase() === 'li')
          .map(li => {
            const liEl = li as HTMLElement;
            return liEl.outerHTML
              .replace(/data-list="bullet"/gi, '')
              .replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
          })
          .join('');
        blocks.push({ id: generateId(), type: "list", content: liElements, attributes: {} });
      } else {
        // Numbered list - extract LI elements
        const liElements = Array.from(el.children)
          .filter(child => child.tagName.toLowerCase() === 'li')
          .map(li => (li as HTMLElement).outerHTML)
          .join('');
        blocks.push({ id: generateId(), type: "orderedList", content: liElements, attributes: {} });
      }
    }
    else if (tag === "blockquote") blocks.push({ id: generateId(), type: "quote", content: el.innerHTML, attributes: {} });
    else if (tag === "hr") blocks.push({ id: generateId(), type: "separator", content: "", attributes: {} });
    else if (tag === "pre") blocks.push({ id: generateId(), type: "code", content: el.textContent || "", attributes: {} });
    else if (tag === "img") blocks.push({ id: generateId(), type: "image", content: "", attributes: { src: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "", align: "center" } });
    else if (tag === "iframe") blocks.push({ id: generateId(), type: "video", content: el.outerHTML, attributes: {} });
    else {
      // For other elements like DIV, SPAN etc., process children
      el.childNodes.forEach(processNode);
    }
  };

  doc.body.childNodes.forEach(processNode);
  if (blocks.length === 0) {
    blocks.push({ id: generateId(), type: "paragraph", content: html, attributes: {} });
  }
  return blocks;
}

function blocksToHtml(blocks: Block[]): string {
  // Helper to clean list content
  const cleanListContent = (content: string): string => {
    if (!content) return '';
    let cleaned = content;
    // Remove any outer OL/UL wrappers
    cleaned = cleaned.replace(/^<ol[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/ol>\s*$/gi, '');
    cleaned = cleaned.replace(/^<ul[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/ul>\s*$/gi, '');
    // Remove Quill attributes
    cleaned = cleaned.replace(/data-list="[^"]*"/gi, '');
    cleaned = cleaned.replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
    return cleaned;
  };
  
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return `<p>${block.content}</p>`;
        case "heading1":
          return `<h1>${block.content}</h1>`;
        case "heading2":
          return `<h2>${block.content}</h2>`;
        case "heading3":
          return `<h3>${block.content}</h3>`;
        case "list":
          return `<ul>${cleanListContent(block.content)}</ul>`;
        case "orderedList":
          return `<ol>${cleanListContent(block.content)}</ol>`;
        case "quote":
          return `<blockquote>${block.content}</blockquote>`;
        case "separator":
          return "<hr />";
        case "spacer":
          return `<div style="height: ${block.attributes.height || 50}px"></div>`;
        case "image":
          const align = block.attributes.align || "center";
          const textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";
          return `<figure style="text-align: ${textAlign}"><img src="${block.attributes.src || ""}" alt="${block.attributes.alt || ""}" style="max-width: 100%; height: auto; ${block.attributes.width ? `width: ${block.attributes.width}px;` : ""}" /></figure>`;
        case "video":
          return block.content;
        case "code":
          return `<pre><code>${block.content}</code></pre>`;
        case "button":
          return `<div style="text-align: center"><a href="${block.attributes.url || "#"}" style="display: inline-block; padding: 12px 24px; background-color: ${block.attributes.bgColor || "#4f46e5"}; color: ${block.attributes.textColor || "#ffffff"}; text-decoration: none; border-radius: 6px; font-weight: 600;">${block.content || "Click Here"}</a></div>`;
        case "columns":
          return `<div style="display: flex; gap: 20px;">${(block.attributes.columns || [{ content: "" }, { content: "" }]).map((c: any) => `<div style="flex: 1">${c.content}</div>`).join("")}</div>`;
        case "html":
          return block.content;
        default:
          return `<p>${block.content}</p>`;
      }
    })
    .join("\n");
}

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showInserter, setShowInserter] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaBlockId, setMediaBlockId] = useState<string | null>(null);
  const [inserterSearch, setInserterSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const contentEditableRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const parsed = htmlToBlocks(value);
    setBlocks(parsed.length > 0 ? parsed : [{ id: generateId(), type: "paragraph", content: "", attributes: {} }]);
  }, []);

  const pushHistory = useCallback(
    (newBlocks: Block[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const updateBlocks = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      pushHistory(newBlocks);
      onChange(blocksToHtml(newBlocks));
    },
    [pushHistory, onChange]
  );

  const addBlock = useCallback(
    (type: BlockType, afterId?: string) => {
      const newBlock: Block = {
        id: generateId(),
        type,
        content: "",
        attributes: type === "image" ? { src: "", alt: "", align: "center" } : type === "spacer" ? { height: 50 } : type === "button" ? { url: "#", bgColor: "#4f46e5", textColor: "#ffffff" } : type === "columns" ? { columns: [{ content: "" }, { content: "" }] } : {},
      };
      let newBlocks: Block[];
      if (afterId) {
        const idx = blocks.findIndex((b) => b.id === afterId);
        newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
      } else {
        newBlocks = [...blocks, newBlock];
      }
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      setShowInserter(null);
      setTimeout(() => {
        const ref = contentEditableRefs.current[newBlock.id];
        ref?.focus();
      }, 50);
    },
    [blocks, updateBlocks]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) => {
      const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
      setBlocks(newBlocks);
      onChange(blocksToHtml(newBlocks));
    },
    [blocks, onChange]
  );

  const updateBlockAttr = useCallback(
    (id: string, key: string, value: any) => {
      const newBlocks = blocks.map((b) => (b.id === id ? { ...b, attributes: { ...b.attributes, [key]: value } } : b));
      setBlocks(newBlocks);
      onChange(blocksToHtml(newBlocks));
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      if (blocks.length <= 1) return;
      const idx = blocks.findIndex((b) => b.id === id);
      const newBlocks = blocks.filter((b) => b.id !== id);
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlocks[Math.min(idx, newBlocks.length - 1)]?.id || null);
    },
    [blocks, updateBlocks]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const block = blocks.find((b) => b.id === id);
      if (!block) return;
      const idx = blocks.findIndex((b) => b.id === id);
      const newBlock = { ...block, id: generateId(), attributes: { ...block.attributes } };
      const newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
    },
    [blocks, updateBlocks]
  );

  const moveBlock = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = blocks.findIndex((b) => b.id === id);
      if ((direction === "up" && idx === 0) || (direction === "down" && idx === blocks.length - 1)) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      updateBlocks(newBlocks);
      setSelectedBlockId(id);
    },
    [blocks, updateBlocks]
  );

  const handleMediaSelect = useCallback(
    (url: string) => {
      if (mediaBlockId) {
        updateBlockAttr(mediaBlockId, "src", url);
      }
      setShowMediaModal(false);
      setMediaBlockId(null);
    },
    [mediaBlockId, updateBlockAttr]
  );

  const filteredBlocks = inserterSearch
    ? BLOCK_DEFINITIONS.filter(
        (b) => b.name.toLowerCase().includes(inserterSearch.toLowerCase()) || b.category.toLowerCase().includes(inserterSearch.toLowerCase())
      )
    : BLOCK_DEFINITIONS;

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const handleContentInput = (id: string, e: React.FormEvent<HTMLDivElement>) => {
    let content = e.currentTarget.innerHTML;
    
    // Special handling for list blocks - clean Quill formatting
    const block = blocks.find(b => b.id === id);
    if (block && (block.type === 'list' || block.type === 'orderedList')) {
      console.log('BEFORE CLEAN:', content);
      
      // BRUTE FORCE CLEAN: Remove ALL OL/UL wrapper tags and Quill formatting
      // Step 1: Remove opening OL/UL tags (with any attributes)
      content = content.replace(/<ol[^>]*>/gi, '');
      content = content.replace(/<ul[^>]*>/gi, '');
      
      // Step 2: Remove closing OL/UL tags
      content = content.replace(/<\/ol>/gi, '');
      content = content.replace(/<\/ul>/gi, '');
      
      // Step 3: Remove data-list attributes from LI tags
      content = content.replace(/data-list="[^"]*"/gi, '');
      
      // Step 4: Remove Quill UI spans
      content = content.replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
      
      console.log('AFTER CLEAN:', content);
    }
    
    updateBlock(id, { content });
  };

  const handleContentKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const block = blocks.find((b) => b.id === id);
      if (block && (block.type === "paragraph" || block.type === "heading1" || block.type === "heading2" || block.type === "heading3")) {
        e.preventDefault();
        addBlock("paragraph", id);
      }
    }
    if (e.key === "Backspace") {
      const block = blocks.find((b) => b.id === id);
      const ref = contentEditableRefs.current[id];
      if (block && ref && ref.innerHTML === "" && blocks.length > 1) {
        e.preventDefault();
        const idx = blocks.findIndex((b) => b.id === id);
        deleteBlock(id);
        if (idx > 0) {
          setSelectedBlockId(blocks[idx - 1].id);
          setTimeout(() => {
            const prevRef = contentEditableRefs.current[blocks[idx - 1].id];
            prevRef?.focus();
          }, 50);
        }
      }
    }
  };

  const renderBlockContent = (block: Block) => {
    const isSelected = selectedBlockId === block.id;
    const baseProps = {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: (e: React.FormEvent<HTMLElement>) => handleContentInput(block.id, e as any),
      onKeyDown: (e: React.KeyboardEvent) => handleContentKeyDown(block.id, e),
      onFocus: () => setSelectedBlockId(block.id),
      className: "outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400",
      "data-placeholder": block.type === "paragraph" ? "Start writing or type / to insert a block..." : block.type === "heading1" ? "Heading 1" : block.type === "heading2" ? "Heading 2" : block.type === "heading3" ? "Heading 3" : "",
    };

    const setRef = (el: HTMLElement | null) => {
      contentEditableRefs.current[block.id] = el as any;
    };

    switch (block.type) {
      case "paragraph":
        return <div ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} className={`${baseProps.className} text-base leading-relaxed`} />;
      case "heading1":
        return <h1 ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} className={`${baseProps.className} text-3xl font-bold`} />;
      case "heading2":
        return <h2 ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} className={`${baseProps.className} text-2xl font-bold`} />;
      case "heading3":
        return <h3 ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} className={`${baseProps.className} text-xl font-semibold`} />;
      case "list": {
        // Aggressively clean content: extract only LI elements, remove all Quill formatting
        let content = block.content;
        
        // Use DOMParser to properly extract LI elements
        if (typeof window !== 'undefined') {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const liElements = doc.querySelectorAll('li');
            if (liElements.length > 0) {
              content = Array.from(liElements)
                .map(li => {
                  let liHtml = (li as HTMLElement).outerHTML;
                  // Remove Quill attributes
                  liHtml = liHtml.replace(/data-list="[^"]*"/gi, '');
                  liHtml = liHtml.replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
                  return liHtml;
                })
                .join('');
            }
          } catch (e) {
            // Fallback to regex
            const liRegex = /<li[^>]*>[\s\S]*?<\/li>/gi;
            const matches = content.match(liRegex);
            if (matches && matches.length > 0) {
              content = matches
                .map(li => li.replace(/data-list="[^"]*"/gi, '').replace(/<span class="ql-ui"[^>]*><\/span>/gi, ''))
                .join('');
            }
          }
        }
        
        console.log('RENDERING LIST block:', block.id, 'original:', block.content.substring(0, 200), 'cleaned:', content.substring(0, 200));
        return <ul ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: content }} className={`${baseProps.className} pl-6 space-y-1`} style={{ listStyleType: 'disc' }} />;
      }
      case "orderedList": {
        // Aggressively clean content: extract only LI elements
        let content = block.content;
        
        // Use DOMParser to properly extract LI elements
        if (typeof window !== 'undefined') {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const liElements = doc.querySelectorAll('li');
            if (liElements.length > 0) {
              content = Array.from(liElements)
                .map(li => (li as HTMLElement).outerHTML)
                .join('');
            }
          } catch (e) {
            // Fallback to regex
            const liRegex = /<li[^>]*>[\s\S]*?<\/li>/gi;
            const matches = content.match(liRegex);
            if (matches && matches.length > 0) {
              content = matches.join('');
            }
          }
        }
        
        console.log('RENDERING ORDERED LIST block:', block.id, 'cleaned:', content.substring(0, 200));
        return <ol ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: content }} className={`${baseProps.className} pl-6 space-y-1`} style={{ listStyleType: 'decimal' }} />;
      }
      case "quote":
        return (
          <blockquote ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} className={`${baseProps.className} border-l-4 border-indigo-500 pl-4 italic text-slate-600 text-lg`} />
        );
      case "code":
        return (
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm">
            <code contentEditable suppressContentEditableWarning ref={(el) => { contentEditableRefs.current[block.id] = el as any; }} onInput={(e) => handleContentInput(block.id, e as any)} onKeyDown={(e) => handleContentKeyDown(block.id, e)} onFocus={() => setSelectedBlockId(block.id)} dangerouslySetInnerHTML={{ __html: block.content }} className="outline-none" />
          </pre>
        );
      case "image":
        return (
          <div className="space-y-3">
            {!block.attributes.src ? (
              <div className="flex items-center justify-center h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setMediaBlockId(block.id);
                    setShowMediaModal(true);
                  }}
                  className="flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600"
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm font-medium">Choose Image</span>
                </button>
              </div>
            ) : (
              <div className={`relative group ${block.attributes.align === "left" ? "text-left" : block.attributes.align === "right" ? "text-right" : "text-center"}`}>
                <img src={block.attributes.src} alt={block.attributes.alt || ""} className="max-w-full h-auto rounded-lg" style={block.attributes.width ? { width: `${block.attributes.width}px` } : undefined} />
                <button
                  type="button"
                  onClick={() => {
                    setMediaBlockId(block.id);
                    setShowMediaModal(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              type="text"
              value={block.attributes.alt || ""}
              onChange={(e) => updateBlockAttr(block.id, "alt", e.target.value)}
              placeholder="Alt text (optional)"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none"
            />
          </div>
        );
      case "video":
        return (
          <div className="space-y-2">
            {!block.content ? (
              <input
                type="text"
                value={block.attributes.url || ""}
                onChange={(e) => {
                  updateBlockAttr(block.id, "url", e.target.value);
                  if (e.target.value.includes("youtube") || e.target.value.includes("vimeo")) {
                    const videoId = e.target.value.includes("youtube") ? e.target.value.split("v=")[1]?.split("&")[0] : e.target.value.split("/").pop();
                    const platform = e.target.value.includes("youtube") ? "youtube" : "vimeo";
                    const embedUrl = platform === "youtube" ? `https://www.youtube.com/embed/${videoId}` : `https://player.vimeo.com/video/${videoId}`;
                    updateBlock(block.id, { content: `<iframe src="${embedUrl}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`, attributes: { ...block.attributes, url: e.target.value } });
                  }
                }}
                placeholder="Paste YouTube or Vimeo URL..."
                className="w-full px-3 py-2 border border-slate-200 rounded focus:border-indigo-500 outline-none"
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: block.content }} className="rounded-lg overflow-hidden" />
            )}
          </div>
        );
      case "separator":
        return <hr className="border-slate-300" />;
      case "spacer":
        return (
          <div className="flex items-center justify-center py-2">
            <div className="w-full border border-dashed border-slate-300 rounded py-2 text-center">
              <span className="text-xs text-slate-400">{block.attributes.height || 50}px spacer</span>
            </div>
          </div>
        );
      case "button":
        return (
          <div className="text-center space-y-2">
            <a
              href={block.attributes.url || "#"}
              style={{ backgroundColor: block.attributes.bgColor || "#4f46e5", color: block.attributes.textColor || "#ffffff" }}
              className="inline-block px-6 py-3 rounded-lg font-semibold text-sm"
            >
              {block.content || "Click Here"}
            </a>
            <div className="flex gap-2 justify-center">
              <input type="text" value={block.attributes.url || "#"} onChange={(e) => updateBlockAttr(block.id, "url", e.target.value)} placeholder="Button URL" className="px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none w-48" />
              <input type="color" value={block.attributes.bgColor || "#4f46e5"} onChange={(e) => updateBlockAttr(block.id, "bgColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <input type="color" value={block.attributes.textColor || "#ffffff"} onChange={(e) => updateBlockAttr(block.id, "textColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
            </div>
          </div>
        );
      case "html":
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            onFocus={() => setSelectedBlockId(block.id)}
            placeholder="Enter custom HTML..."
            className="w-full p-4 font-mono text-sm bg-slate-900 text-green-400 rounded-lg outline-none resize-y min-h-[120px]"
          />
        );
      case "columns":
        const cols = block.attributes.columns || [{ content: "" }, { content: "" }];
        return (
          <div className="flex gap-4">
            {cols.map((col: any, i: number) => (
              <div key={i} className="flex-1 min-w-0">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const newCols = [...cols];
                    newCols[i] = { ...col, content: (e.target as HTMLDivElement).innerHTML };
                    updateBlockAttr(block.id, "columns", newCols);
                  }}
                  onFocus={() => setSelectedBlockId(block.id)}
                  dangerouslySetInnerHTML={{ __html: col.content }}
                  className="outline-none min-h-[60px] p-3 border border-dashed border-slate-300 rounded empty:before:content-['Type_here...'] empty:before:text-slate-400"
                />
              </div>
            ))}
          </div>
        );
      default:
        return <div ref={setRef as any} {...baseProps} dangerouslySetInnerHTML={{ __html: block.content }} />;
    }
  };

  return (
    <div className="overflow-hidden bg-white">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                const prevBlocks = history[historyIndex - 1];
                setBlocks(prevBlocks);
                onChange(blocksToHtml(prevBlocks));
              }
            }}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (historyIndex < history.length - 1) {
                setHistoryIndex(historyIndex + 1);
                const nextBlocks = history[historyIndex + 1];
                setBlocks(nextBlocks);
                onChange(blocksToHtml(nextBlocks));
              }
            }}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-300 mx-1" />
          <button type="button" onClick={() => setShowInserter("top")} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5" />
            Add Block
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
          <button type="button" onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded ${showSettings ? "bg-indigo-100 text-indigo-600" : "hover:bg-slate-200"}`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Blocks Area */}
        <div className="flex-1 min-w-0">
          <div className="p-6 space-y-1">
            {blocks.map((block, index) => (
              <div key={block.id} className={`group relative transition-all ${selectedBlockId === block.id ? "ring-2 ring-indigo-500 ring-offset-2 rounded-lg" : "hover:ring-1 hover:ring-slate-300 rounded-lg"}`}>
                {/* Block Toolbar */}
                {selectedBlockId === block.id && (
                  <div className="absolute -top-10 left-0 z-10 flex items-center gap-0.5 bg-slate-800 rounded-lg shadow-lg px-1 py-0.5">
                    <button type="button" onClick={() => setShowInserter(block.id)} className="p-1 text-white hover:bg-slate-700 rounded" title="Add block before">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-600 mx-0.5" />
                    <button type="button" onClick={() => moveBlock(block.id, "up")} disabled={index === 0} className="p-1 text-white hover:bg-slate-700 rounded disabled:opacity-30">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => moveBlock(block.id, "down")} disabled={index === blocks.length - 1} className="p-1 text-white hover:bg-slate-700 rounded disabled:opacity-30">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-600 mx-0.5" />
                    <button type="button" onClick={() => duplicateBlock(block.id)} className="p-1 text-white hover:bg-slate-700 rounded">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteBlock(block.id)} disabled={blocks.length <= 1} className="p-1 text-red-400 hover:bg-slate-700 rounded disabled:opacity-30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-600 mx-0.5" />
                    <div className="flex items-center gap-0.5 px-1">
                      <span className="text-xs text-slate-400 capitalize">{block.type.replace(/([A-Z])/g, " $1").trim()}</span>
                    </div>
                    <GripVertical className="w-3.5 h-3.5 text-slate-500 ml-1 cursor-grab" />
                  </div>
                )}

                {/* Block Content */}
                <div className="px-4 py-2" onClick={() => setSelectedBlockId(block.id)}>
                  {renderBlockContent(block)}
                </div>

                {/* Inserter between blocks */}
                {showInserter === block.id && (
                  <BlockInserter search={inserterSearch} onSearch={setInserterSearch} filteredBlocks={filteredBlocks} onSelect={(type) => addBlock(type, block.id)} onClose={() => setShowInserter(null)} />
                )}
              </div>
            ))}

            {/* Add block at end */}
            <button type="button" onClick={() => setShowInserter("end")} className="w-full flex items-center justify-center gap-2 py-4 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add Block</span>
            </button>

            {showInserter === "end" && <BlockInserter search={inserterSearch} onSearch={setInserterSearch} filteredBlocks={filteredBlocks} onSelect={(type) => addBlock(type)} onClose={() => setShowInserter(null)} />}
            {showInserter === "top" && <BlockInserter search={inserterSearch} onSearch={setInserterSearch} filteredBlocks={filteredBlocks} onSelect={(type) => addBlock(type)} onClose={() => setShowInserter(null)} />}
          </div>
        </div>

        {/* Settings Sidebar */}
        {showSettings && selectedBlock && (
          <div className="w-72 border-l border-slate-200 bg-slate-50 p-4 space-y-4 overflow-y-auto max-h-[600px]">
            <h3 className="text-sm font-semibold text-slate-700">Block Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Block Type</label>
                <p className="text-sm text-slate-800 capitalize mt-1">{selectedBlock.type.replace(/([A-Z])/g, " $1").trim()}</p>
              </div>
              {selectedBlock.type === "image" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Alignment</label>
                    <div className="flex gap-1 mt-1">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button key={align} type="button" onClick={() => updateBlockAttr(selectedBlock.id, "align", align)} className={`p-2 rounded ${selectedBlock.attributes.align === align ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}>
                          {align === "left" ? <AlignLeft className="w-4 h-4" /> : align === "center" ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Width (px)</label>
                    <input type="number" value={selectedBlock.attributes.width || ""} onChange={(e) => updateBlockAttr(selectedBlock.id, "width", e.target.value ? parseInt(e.target.value) : null)} className="w-full mt-1 px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none" placeholder="Auto" />
                  </div>
                </>
              )}
              {selectedBlock.type === "spacer" && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Height: {selectedBlock.attributes.height || 50}px</label>
                  <input type="range" min="10" max="200" value={selectedBlock.attributes.height || 50} onChange={(e) => updateBlockAttr(selectedBlock.id, "height", parseInt(e.target.value))} className="w-full mt-1" />
                </div>
              )}
              {selectedBlock.type === "button" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Button URL</label>
                    <input type="text" value={selectedBlock.attributes.url || "#"} onChange={(e) => updateBlockAttr(selectedBlock.id, "url", e.target.value)} className="w-full mt-1 px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Background Color</label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={selectedBlock.attributes.bgColor || "#4f46e5"} onChange={(e) => updateBlockAttr(selectedBlock.id, "bgColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                      <input type="text" value={selectedBlock.attributes.bgColor || "#4f46e5"} onChange={(e) => updateBlockAttr(selectedBlock.id, "bgColor", e.target.value)} className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Text Color</label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={selectedBlock.attributes.textColor || "#ffffff"} onChange={(e) => updateBlockAttr(selectedBlock.id, "textColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                      <input type="text" value={selectedBlock.attributes.textColor || "#ffffff"} onChange={(e) => updateBlockAttr(selectedBlock.id, "textColor", e.target.value)} className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none font-mono" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaLibraryModal isOpen={showMediaModal} onClose={() => { setShowMediaModal(false); setMediaBlockId(null); }} onSelect={handleMediaSelect} title="Select Image" />
    </div>
  );
}

function BlockInserter({ search, onSearch, filteredBlocks, onSelect, onClose }: { search: string; onSearch: (v: string) => void; filteredBlocks: BlockDefinition[]; onSelect: (type: BlockType) => void; onClose: () => void }) {
  const grouped = CATEGORIES.map((cat) => ({ category: cat, blocks: filteredBlocks.filter((b) => b.category === cat) })).filter((g) => g.blocks.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-md mx-auto my-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Add Block</h3>
        <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search blocks..." autoFocus className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-3">
        {grouped.map(({ category, blocks }) => (
          <div key={category}>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{category}</p>
            <div className="grid grid-cols-2 gap-1">
              {blocks.map((def) => (
                <button key={def.type} type="button" onClick={() => onSelect(def.type)} className="flex items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50 rounded-lg transition-colors group">
                  <def.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{def.name}</p>
                    <p className="text-xs text-slate-400">{def.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
