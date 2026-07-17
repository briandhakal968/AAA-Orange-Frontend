"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/context/country-context";

export function CountrySelector() {
  const { countries, selectedCountry, setSelectedCountry, loading } = useCountry();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 right-0 bg-white rounded-xl shadow-xl border border-neutral-200 w-64 overflow-hidden"
          >
            <div className="p-3 border-b border-neutral-100">
              <p className="text-xs text-neutral-500">Select your pickup location</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.id}
                  onClick={() => {
                    setSelectedCountry(country);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 transition-colors text-left"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm text-black flex-1">{country.name}</span>
                  <span className="text-xs text-neutral-500">{country.currency_symbol}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-neutral-200 shadow-md rounded-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
        aria-label="Select pickup location"
      >
        <span>{selectedCountry ? selectedCountry.flag : "📍"}</span>
        <span>{selectedCountry ? selectedCountry.name : "Pickup Location"}</span>
        <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
