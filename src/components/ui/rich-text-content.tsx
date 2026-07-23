"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import { useTypography } from '@/hooks/use-typography';

interface TypographySetting {
  font_family: string;
  font_size: number;
  line_height: number;
  margin_bottom: number;
  color: string;
  font_weight: number;
}

interface TypographyData {
  h1: TypographySetting;
  h2: TypographySetting;
  h3: TypographySetting;
  h4: TypographySetting;
  h5: TypographySetting;
  h6: TypographySetting;
  paragraph: TypographySetting;
}

const DEFAULT_TYPOGRAPHY: TypographyData = {
  h1: { font_family: 'inherit', font_size: 32, line_height: 1.2, margin_bottom: 16, color: '#000000', font_weight: 700 },
  h2: { font_family: 'inherit', font_size: 24, line_height: 1.3, margin_bottom: 12, color: '#000000', font_weight: 700 },
  h3: { font_family: 'inherit', font_size: 20, line_height: 1.4, margin_bottom: 8, color: '#000000', font_weight: 600 },
  h4: { font_family: 'inherit', font_size: 18, line_height: 1.4, margin_bottom: 8, color: '#000000', font_weight: 600 },
  h5: { font_family: 'inherit', font_size: 16, line_height: 1.4, margin_bottom: 6, color: '#000000', font_weight: 500 },
  h6: { font_family: 'inherit', font_size: 14, line_height: 1.4, margin_bottom: 4, color: '#000000', font_weight: 500 },
  paragraph: { font_family: 'inherit', font_size: 16, line_height: 1.6, margin_bottom: 16, color: '#000000', font_weight: 400 },
};

function reconstructTypography(raw: Record<string, string> | null | undefined): TypographyData {
  if (!raw || Object.keys(raw).length === 0) return DEFAULT_TYPOGRAPHY;
  const reconstructed: TypographyData = { ...DEFAULT_TYPOGRAPHY };
  (Object.keys(DEFAULT_TYPOGRAPHY) as (keyof TypographyData)[]).forEach((key) => {
    const fontSize = raw[`${key}_font_size`];
    const fontFamily = raw[`${key}_font_family`];
    const lineHeight = raw[`${key}_line_height`];
    const marginBottom = raw[`${key}_margin_bottom`];
    const color = raw[`${key}_color`];
    const fontWeight = raw[`${key}_font_weight`];

    if (fontSize || fontFamily || lineHeight || marginBottom || color || fontWeight) {
      reconstructed[key] = {
        font_family: fontFamily || DEFAULT_TYPOGRAPHY[key].font_family,
        font_size: fontSize ? parseFloat(fontSize) : DEFAULT_TYPOGRAPHY[key].font_size,
        line_height: lineHeight ? parseFloat(lineHeight) : DEFAULT_TYPOGRAPHY[key].line_height,
        margin_bottom: marginBottom ? parseFloat(marginBottom) : DEFAULT_TYPOGRAPHY[key].margin_bottom,
        color: color || DEFAULT_TYPOGRAPHY[key].color,
        font_weight: fontWeight ? parseInt(fontWeight) : DEFAULT_TYPOGRAPHY[key].font_weight,
      };
    }
  });
  return reconstructed;
}

interface RichTextContentProps {
  html: string;
  className?: string;
  initialTypography?: Record<string, string> | null;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function RichTextContent({ html, className = "", initialTypography }: RichTextContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { typography, loaded } = useTypography();

  // If the parent fetched the typography on the server, use it directly so
  // the content renders on the first paint with the correct styles (no
  // flash, no waiting for the client-side typography fetch).
  const effectiveTypography = initialTypography
    ? reconstructTypography(initialTypography)
    : typography;

  // Apply typography via inline CSS variables on the container so the styles
  // are present in the initial render and don't cause a flash of unstyled text.
  const styleVars: React.CSSProperties = {
    ['--rtc-h1-size' as any]: `${effectiveTypography.h1.font_size}px`,
    ['--rtc-h1-lh' as any]: effectiveTypography.h1.line_height,
    ['--rtc-h1-mb' as any]: `${effectiveTypography.h1.margin_bottom}px`,
    ['--rtc-h1-ff' as any]: effectiveTypography.h1.font_family,
    ['--rtc-h1-color' as any]: effectiveTypography.h1.color,
    ['--rtc-h1-fw' as any]: effectiveTypography.h1.font_weight,

    ['--rtc-h2-size' as any]: `${effectiveTypography.h2.font_size}px`,
    ['--rtc-h2-lh' as any]: effectiveTypography.h2.line_height,
    ['--rtc-h2-mb' as any]: `${effectiveTypography.h2.margin_bottom}px`,
    ['--rtc-h2-ff' as any]: effectiveTypography.h2.font_family,
    ['--rtc-h2-color' as any]: effectiveTypography.h2.color,
    ['--rtc-h2-fw' as any]: effectiveTypography.h2.font_weight,

    ['--rtc-h3-size' as any]: `${effectiveTypography.h3.font_size}px`,
    ['--rtc-h3-lh' as any]: effectiveTypography.h3.line_height,
    ['--rtc-h3-mb' as any]: `${effectiveTypography.h3.margin_bottom}px`,
    ['--rtc-h3-ff' as any]: effectiveTypography.h3.font_family,
    ['--rtc-h3-color' as any]: effectiveTypography.h3.color,
    ['--rtc-h3-fw' as any]: effectiveTypography.h3.font_weight,

    ['--rtc-h4-size' as any]: `${effectiveTypography.h4.font_size}px`,
    ['--rtc-h4-lh' as any]: effectiveTypography.h4.line_height,
    ['--rtc-h4-mb' as any]: `${effectiveTypography.h4.margin_bottom}px`,
    ['--rtc-h4-ff' as any]: effectiveTypography.h4.font_family,
    ['--rtc-h4-color' as any]: effectiveTypography.h4.color,
    ['--rtc-h4-fw' as any]: effectiveTypography.h4.font_weight,

    ['--rtc-h5-size' as any]: `${effectiveTypography.h5.font_size}px`,
    ['--rtc-h5-lh' as any]: effectiveTypography.h5.line_height,
    ['--rtc-h5-mb' as any]: `${effectiveTypography.h5.margin_bottom}px`,
    ['--rtc-h5-ff' as any]: effectiveTypography.h5.font_family,
    ['--rtc-h5-color' as any]: effectiveTypography.h5.color,
    ['--rtc-h5-fw' as any]: effectiveTypography.h5.font_weight,

    ['--rtc-h6-size' as any]: `${effectiveTypography.h6.font_size}px`,
    ['--rtc-h6-lh' as any]: effectiveTypography.h6.line_height,
    ['--rtc-h6-mb' as any]: `${effectiveTypography.h6.margin_bottom}px`,
    ['--rtc-h6-ff' as any]: effectiveTypography.h6.font_family,
    ['--rtc-h6-color' as any]: effectiveTypography.h6.color,
    ['--rtc-h6-fw' as any]: effectiveTypography.h6.font_weight,

    ['--rtc-p-size' as any]: `${effectiveTypography.paragraph.font_size}px`,
    ['--rtc-p-lh' as any]: effectiveTypography.paragraph.line_height,
    ['--rtc-p-mb' as any]: `${effectiveTypography.paragraph.margin_bottom}px`,
    ['--rtc-p-ff' as any]: effectiveTypography.paragraph.font_family,
    ['--rtc-p-color' as any]: effectiveTypography.paragraph.color,
    ['--rtc-p-fw' as any]: effectiveTypography.paragraph.font_weight,
  } as React.CSSProperties;

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

  // If we have server-fetched typography, render immediately (no flash).
  // Otherwise wait for the context to load.
  if (!initialTypography && !loaded) {
    return (
      <div
        className={`rich-text-content max-w-none ${className}`}
        style={{ minHeight: '4rem' }}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={ref}
      style={styleVars}
      className={`rich-text-content max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processHtml(html) }}
    />
  );
}
