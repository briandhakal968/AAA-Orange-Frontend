"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface CountryContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country) => void;
  clearSelectedCountry: () => void;
  countries: Country[];
  loading: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('selected_country_obj');
      return stored ? (JSON.parse(stored) as Country) : null;
    } catch {
      return null;
    }
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/countries`);
        const data = await response.json();
        setCountries(data);
        
        const urlCountry = searchParams.get('country');
        if (urlCountry) {
          const countryFromUrl = data.find((c: Country) => c.name.toLowerCase() === urlCountry.toLowerCase());
          if (countryFromUrl) {
            setSelectedCountry(countryFromUrl);
            localStorage.setItem('selected_country_obj', JSON.stringify(countryFromUrl));
            localStorage.setItem('selected_country', countryFromUrl.id.toString());
            return;
          }
        }
        
        if (selectedCountry) {
          const stillValid = data.find((c: Country) => c.id === selectedCountry.id);
          if (stillValid) {
            if (!searchParams.get('country')) {
              const url = new URL(window.location.href);
              url.searchParams.set('country', stillValid.name.toLowerCase());
              router.replace(url.pathname + url.search, { scroll: false });
            }
            return;
          }
        }

        const defaultCountry = data.find((c: Country) => c.name.toLowerCase() === 'hong kong') || data[0];
        if (defaultCountry) {
          setSelectedCountry(defaultCountry);
          localStorage.setItem('selected_country_obj', JSON.stringify(defaultCountry));
          localStorage.setItem('selected_country', defaultCountry.id.toString());
          if (!searchParams.get('country')) {
            const url = new URL(window.location.href);
            url.searchParams.set('country', defaultCountry.name.toLowerCase());
            router.replace(url.pathname + url.search, { scroll: false });
          }
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSetSelectedCountry = (country: Country) => {
    setSelectedCountry(country);
    localStorage.setItem('selected_country_obj', JSON.stringify(country));
    localStorage.setItem('selected_country', country.id.toString());
    
    const url = new URL(window.location.href);
    url.searchParams.set('country', country.name.toLowerCase());
    router.push(url.pathname + url.search, { scroll: false });
  };

  const clearSelectedCountry = () => {
    setSelectedCountry(null);
    localStorage.removeItem('selected_country_obj');
    localStorage.removeItem('selected_country');
    
    const url = new URL(window.location.href);
    url.searchParams.delete('country');
    router.push(url.pathname + url.search, { scroll: false });
  };

  return (
    <CountryContext.Provider 
      value={{ 
        selectedCountry, 
        setSelectedCountry: handleSetSelectedCountry, 
        clearSelectedCountry,
        countries, 
        loading 
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
