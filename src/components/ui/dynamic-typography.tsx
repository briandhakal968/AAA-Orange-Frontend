"use client";

import { useEffect } from "react";
import { useTypography } from '@/hooks/use-typography';

export function TypographyStyles() {
  const { typography, loaded } = useTypography();

  useEffect(() => {
    if (!loaded || !typography) return;
    
    const styleId = "dynamic-typography-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const css = `
      .typography-blog-content h1,
      .typography-page-content h1 {
        font-family: ${typography.h1.font_family};
        font-size: ${typography.h1.font_size}px;
        line-height: ${typography.h1.line_height};
        margin-bottom: ${typography.h1.margin_bottom}px;
        color: ${typography.h1.color};
        font-weight: bold;
      }
      .typography-blog-content h2,
      .typography-page-content h2 {
        font-family: ${typography.h2.font_family};
        font-size: ${typography.h2.font_size}px;
        line-height: ${typography.h2.line_height};
        margin-bottom: ${typography.h2.margin_bottom}px;
        color: ${typography.h2.color};
        font-weight: bold;
      }
      .typography-blog-content h3,
      .typography-page-content h3 {
        font-family: ${typography.h3.font_family};
        font-size: ${typography.h3.font_size}px;
        line-height: ${typography.h3.line_height};
        margin-bottom: ${typography.h3.margin_bottom}px;
        color: ${typography.h3.color};
        font-weight: bold;
      }
      .typography-blog-content h4,
      .typography-page-content h4 {
        font-family: ${typography.h4.font_family};
        font-size: ${typography.h4.font_size}px;
        line-height: ${typography.h4.line_height};
        margin-bottom: ${typography.h4.margin_bottom}px;
        color: ${typography.h4.color};
        font-weight: bold;
      }
      .typography-blog-content h5,
      .typography-page-content h5 {
        font-family: ${typography.h5.font_family};
        font-size: ${typography.h5.font_size}px;
        line-height: ${typography.h5.line_height};
        margin-bottom: ${typography.h5.margin_bottom}px;
        color: ${typography.h5.color};
        font-weight: bold;
      }
      .typography-blog-content h6,
      .typography-page-content h6 {
        font-family: ${typography.h6.font_family};
        font-size: ${typography.h6.font_size}px;
        line-height: ${typography.h6.line_height};
        margin-bottom: ${typography.h6.margin_bottom}px;
        color: ${typography.h6.color};
        font-weight: bold;
      }
      .typography-blog-content p,
      .typography-page-content p {
        font-family: ${typography.paragraph.font_family};
        font-size: ${typography.paragraph.font_size}px;
        line-height: ${typography.paragraph.line_height};
        margin-bottom: ${typography.paragraph.margin_bottom}px;
        color: ${typography.paragraph.color};
      }
      .typography-blog-content {
        font-family: ${typography.paragraph.font_family};
        font-size: ${typography.paragraph.font_size}px;
        line-height: ${typography.paragraph.line_height};
        color: ${typography.paragraph.color};
      }
      .typography-page-content {
        font-family: ${typography.paragraph.font_family};
        font-size: ${typography.paragraph.font_size}px;
        line-height: ${typography.paragraph.line_height};
        color: ${typography.paragraph.color};
      }
    `;

    styleEl.textContent = css;
  }, [typography, loaded]);

  return null;
}

interface DynamicTypographyProps {
  children: React.ReactNode;
  variant?: "blog" | "page";
}

export function DynamicTypography({ children, variant = "page" }: DynamicTypographyProps) {
  const className = variant === "blog" ? "typography-blog-content" : "typography-page-content";
  
  return <div className={className}>{children}</div>;
}