"use client";

import { useRef, useEffect } from "react";
import { useTypography } from '@/hooks/use-typography';

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { typography, loading } = useTypography();

  // Apply typography styles to the content
  useEffect(() => {
    if (!loading && typography && ref.current) {
      const styleId = 'rich-text-typography-styles';
      let styleEl = document.getElementById(styleId);
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
       styleEl.textContent = `
         .rich-text-content h1 { font-size: ${typography.h1.font_size}px; line-height: ${typography.h1.line_height}; margin-bottom: ${typography.h1.margin_bottom}px; font-family: ${typography.h1.font_family}; color: ${typography.h1.color}; font-weight: ${typography.h1.font_weight}; }
         .rich-text-content h2 { font-size: ${typography.h2.font_size}px; line-height: ${typography.h2.line_height}; margin-bottom: ${typography.h2.margin_bottom}px; font-family: ${typography.h2.font_family}; color: ${typography.h2.color}; font-weight: ${typography.h2.font_weight}; }
         .rich-text-content h3 { font-size: ${typography.h3.font_size}px; line-height: ${typography.h3.line_height}; margin-bottom: ${typography.h3.margin_bottom}px; font-family: ${typography.h3.font_family}; color: ${typography.h3.color}; font-weight: ${typography.h3.font_weight}; }
         .rich-text-content h4 { font-size: ${typography.h4.font_size}px; line-height: ${typography.h4.line_height}; margin-bottom: ${typography.h4.margin_bottom}px; font-family: ${typography.h4.font_family}; color: ${typography.h4.color}; font-weight: ${typography.h4.font_weight}; }
         .rich-text-content h5 { font-size: ${typography.h5.font_size}px; line-height: ${typography.h5.line_height}; margin-bottom: ${typography.h5.margin_bottom}px; font-family: ${typography.h5.font_family}; color: ${typography.h5.color}; font-weight: ${typography.h5.font_weight}; }
         .rich-text-content h6 { font-size: ${typography.h6.font_size}px; line-height: ${typography.h6.line_height}; margin-bottom: ${typography.h6.margin_bottom}px; font-family: ${typography.h6.font_family}; color: ${typography.h6.color}; font-weight: ${typography.h6.font_weight}; }
         .rich-text-content p { font-size: ${typography.paragraph.font_size}px; line-height: ${typography.paragraph.line_height}; margin-bottom: ${typography.paragraph.margin_bottom}px; font-family: ${typography.paragraph.font_family}; color: ${typography.paragraph.color}; font-weight: ${typography.paragraph.font_weight}; }
         .rich-text-content ul, .rich-text-content ol { line-height: 0.8; padding-left: 1em; margin-bottom: 15px; }
         .rich-text-content li { line-height: 0.8; }
         .rich-text-content li p { margin-bottom: 0; }
       `;
    }
  }, [typography, loading]);

  // Simple HTML processing - just clean Quill formatting
  const processHtml = (html: string): string => {
    if (!html) return '';
    
    let processed = html;
    
    // Remove Quill formatting attributes
    processed = processed.replace(/data-list="[^"]*"/gi, '');
    processed = processed.replace(/<span class="ql-ui"[^>]*><\/span>/gi, '');
    
    // Convert any remaining OL with bullet indicators to UL
    processed = processed.replace(
      /<ol([^>]*)>([\s\S]*?)<\/ol>/gi,
      (match, attrs, content) => {
        if (content.includes('data-list="bullet"') || content.includes("data-list='bullet'")) {
          return `<ul${attrs}>${content}</ul>`;
        }
        return match;
      }
    );
    
    return processed;
  };

  return (
    <div
      ref={ref}
      className={`rich-text-content prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processHtml(html) }}
    />
  );
}
