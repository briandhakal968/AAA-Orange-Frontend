"use client";

import { useEffect } from "react";

interface TypographySetting {
  font_family: string;
  font_size: number;
  line_height: number;
  margin_bottom: number;
}

const DEFAULT_ELEMENTS: Record<string, TypographySetting> = {
  h1: { font_family: "inherit", font_size: 32, line_height: 1.2, margin_bottom: 16 },
  h2: { font_family: "inherit", font_size: 24, line_height: 1.3, margin_bottom: 12 },
  h3: { font_family: "inherit", font_size: 20, line_height: 1.4, margin_bottom: 8 },
  h4: { font_family: "inherit", font_size: 18, line_height: 1.4, margin_bottom: 8 },
  h5: { font_family: "inherit", font_size: 16, line_height: 1.4, margin_bottom: 6 },
  h6: { font_family: "inherit", font_size: 14, line_height: 1.4, margin_bottom: 4 },
  paragraph: { font_family: "inherit", font_size: 16, line_height: 1.6, margin_bottom: 16 },
};

function applyTypography(data: Record<string, string>) {
  const styleId = "global-typography-styles";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    (document.head || document.getElementsByTagName("head")[0]).appendChild(styleEl);
  }

  const getValue = (key: string, defaultValue: string | number, isNumber = false): string => {
    const value = data[key];
    if (isNumber) {
      return value ? `${value}px` : `${defaultValue}px`;
    }
    return value || String(defaultValue);
  };

  const getSetting = (el: string) => {
    const def = DEFAULT_ELEMENTS[el];
    return {
      fontFamily: getValue(`${el}_font_family`, def.font_family),
      fontSize: getValue(`${el}_font_size`, def.font_size, true),
      lineHeight: getValue(`${el}_line_height`, def.line_height),
      marginBottom: getValue(`${el}_margin_bottom`, def.margin_bottom, true),
    };
  };

  const h1 = getSetting("h1");
  const h2 = getSetting("h2");
  const h3 = getSetting("h3");
  const h4 = getSetting("h4");
  const h5 = getSetting("h5");
  const h6 = getSetting("h6");
  const p = getSetting("paragraph");

  let css = `:root {
    --h1-font-family: ${h1.fontFamily};
    --h1-font-size: ${h1.fontSize};
    --h1-line-height: ${h1.lineHeight};
    --h1-margin-bottom: ${h1.marginBottom};
    --h2-font-family: ${h2.fontFamily};
    --h2-font-size: ${h2.fontSize};
    --h2-line-height: ${h2.lineHeight};
    --h2-margin-bottom: ${h2.marginBottom};
    --h3-font-family: ${h3.fontFamily};
    --h3-font-size: ${h3.fontSize};
    --h3-line-height: ${h3.lineHeight};
    --h3-margin-bottom: ${h3.marginBottom};
    --h4-font-family: ${h4.fontFamily};
    --h4-font-size: ${h4.fontSize};
    --h4-line-height: ${h4.lineHeight};
    --h4-margin-bottom: ${h4.marginBottom};
    --h5-font-family: ${h5.fontFamily};
    --h5-font-size: ${h5.fontSize};
    --h5-line-height: ${h5.lineHeight};
    --h5-margin-bottom: ${h5.marginBottom};
    --h6-font-family: ${h6.fontFamily};
    --h6-font-size: ${h6.fontSize};
    --h6-line-height: ${h6.lineHeight};
    --h6-margin-bottom: ${h6.marginBottom};
    --p-font-family: ${p.fontFamily};
    --p-font-size: ${p.fontSize};
    --p-line-height: ${p.lineHeight};
    --p-margin-bottom: ${p.marginBottom};
  }

  .typography-page-content h1,
  .typography-blog-content h1 {
    font-family: var(--h1-font-family);
    font-size: var(--h1-font-size);
    line-height: var(--h1-line-height);
    margin-bottom: var(--h1-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content h2,
  .typography-blog-content h2 {
    font-family: var(--h2-font-family);
    font-size: var(--h2-font-size);
    line-height: var(--h2-line-height);
    margin-bottom: var(--h2-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content h3,
  .typography-blog-content h3 {
    font-family: var(--h3-font-family);
    font-size: var(--h3-font-size);
    line-height: var(--h3-line-height);
    margin-bottom: var(--h3-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content h4,
  .typography-blog-content h4 {
    font-family: var(--h4-font-family);
    font-size: var(--h4-font-size);
    line-height: var(--h4-line-height);
    margin-bottom: var(--h4-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content h5,
  .typography-blog-content h5 {
    font-family: var(--h5-font-family);
    font-size: var(--h5-font-size);
    line-height: var(--h5-line-height);
    margin-bottom: var(--h5-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content h6,
  .typography-blog-content h6 {
    font-family: var(--h6-font-family);
    font-size: var(--h6-font-size);
    line-height: var(--h6-line-height);
    margin-bottom: var(--h6-margin-bottom);
    font-weight: bold;
  }
  .typography-page-content p,
  .typography-blog-content p {
    font-family: var(--p-font-family);
    font-size: var(--p-font-size);
    line-height: var(--p-line-height);
    margin-bottom: var(--p-margin-bottom);
  }
  `;

  styleEl.textContent = css;
}

export function GlobalTypographyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTypography({});

    const fetchTypography = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/global-settings/typography`);
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            applyTypography(data);
          }
        }
      } catch (error) {
        console.error("Error fetching global typography:", error);
      }
    };

    fetchTypography();
  }, []);

  return <>{children}</>;
}