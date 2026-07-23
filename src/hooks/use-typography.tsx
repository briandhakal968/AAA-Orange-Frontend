"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

const TypographyContext = createContext<{ typography: TypographyData; loaded: boolean }>({
  typography: DEFAULT_TYPOGRAPHY,
  loaded: false,
});

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [typography, setTypography] = useState<TypographyData>(DEFAULT_TYPOGRAPHY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTypography = async () => {
      try {
        const { api } = await import('@/lib/api');
        const data = await api.get<Record<string, string>>("/typography");
        if (cancelled) return;
        if (data && Object.keys(data).length > 0) {
          const reconstructed: TypographyData = { ...DEFAULT_TYPOGRAPHY };

          (Object.keys(DEFAULT_TYPOGRAPHY) as (keyof TypographyData)[]).forEach((key) => {
            const fontSize = data[`${key}_font_size`];
            const fontFamily = data[`${key}_font_family`];
            const lineHeight = data[`${key}_line_height`];
            const marginBottom = data[`${key}_margin_bottom`];
            const color = data[`${key}_color`];
            const fontWeight = data[`${key}_font_weight`];

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

          setTypography(reconstructed);
        }
      } catch (error) {
        console.error("Error fetching typography:", error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    fetchTypography();
    return () => { cancelled = true; };
  }, []);

  return (
    <TypographyContext.Provider value={{ typography, loaded }}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  return useContext(TypographyContext);
}
