"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollDirectionProps {
  children: React.ReactNode;
}

export function ScrollDirectionProvider({ children }: ScrollDirectionProps) {
  const [showSearch, setShowSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        if (currentScrollY < lastScrollY) {
          setShowSearch(true);
        } else {
          setShowSearch(false);
        }
      } else {
        setShowSearch(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <ScrollContext.Provider value={{ showSearch }}>
      {children}
    </ScrollContext.Provider>
  );
}

import { createContext, useContext } from "react";

const ScrollContext = createContext({ showSearch: true });

export const useScrollDirection = () => useContext(ScrollContext);
