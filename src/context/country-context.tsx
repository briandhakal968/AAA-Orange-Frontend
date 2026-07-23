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

// Local currency map for instant country resolution from URL (avoids flash,
// no API roundtrip needed for currency display). Full data is fetched
// afterwards in the background to populate id/flag/etc.
const CURRENCY_MAP: Record<string, { name: string; currency: string; currency_symbol: string; flag: string }> = {
  "nepal": { name: "Nepal", currency: "NPR", currency_symbol: "₨", flag: "🇳🇵" },
  "hong kong": { name: "Hong Kong", currency: "HKD", currency_symbol: "HK$", flag: "🇭🇰" },
  "india": { name: "India", currency: "INR", currency_symbol: "₹", flag: "🇮🇳" },
  "united states": { name: "United States", currency: "USD", currency_symbol: "$", flag: "🇺🇸" },
  "united kingdom": { name: "United Kingdom", currency: "GBP", currency_symbol: "£", flag: "🇬🇧" },
  "singapore": { name: "Singapore", currency: "SGD", currency_symbol: "S$", flag: "🇸🇬" },
  "malaysia": { name: "Malaysia", currency: "MYR", currency_symbol: "RM", flag: "🇲🇾" },
  "uae": { name: "UAE", currency: "AED", currency_symbol: "د.إ", flag: "🇦🇪" },
  "united arab emirates": { name: "United Arab Emirates", currency: "AED", currency_symbol: "د.إ", flag: "🇦🇪" },
  "australia": { name: "Australia", currency: "AUD", currency_symbol: "A$", flag: "🇦🇺" },
  "canada": { name: "Canada", currency: "CAD", currency_symbol: "C$", flag: "🇨🇦" },
  "japan": { name: "Japan", currency: "JPY", currency_symbol: "¥", flag: "🇯🇵" },
  "china": { name: "China", currency: "CNY", currency_symbol: "¥", flag: "🇨🇳" },
  "south korea": { name: "South Korea", currency: "KRW", currency_symbol: "₩", flag: "🇰🇷" },
  "thailand": { name: "Thailand", currency: "THB", currency_symbol: "฿", flag: "🇹🇭" },
  "indonesia": { name: "Indonesia", currency: "IDR", currency_symbol: "Rp", flag: "🇮🇩" },
  "philippines": { name: "Philippines", currency: "PHP", currency_symbol: "₱", flag: "🇵🇭" },
  "vietnam": { name: "Vietnam", currency: "VND", currency_symbol: "₫", flag: "🇻🇳" },
  "saudi arabia": { name: "Saudi Arabia", currency: "SAR", currency_symbol: "﷼", flag: "🇸🇦" },
  "qatar": { name: "Qatar", currency: "QAR", currency_symbol: "﷼", flag: "🇶🇦" },
  "kuwait": { name: "Kuwait", currency: "KWD", currency_symbol: "د.ك", flag: "🇰🇼" },
  "bahrain": { name: "Bahrain", currency: "BHD", currency_symbol: ".د.ب", flag: "🇧🇭" },
  "oman": { name: "Oman", currency: "OMR", currency_symbol: "﷼", flag: "🇴🇲" },
  "sri lanka": { name: "Sri Lanka", currency: "LKR", currency_symbol: "Rs", flag: "🇱🇰" },
  "bangladesh": { name: "Bangladesh", currency: "BDT", currency_symbol: "৳", flag: "🇧🇩" },
  "pakistan": { name: "Pakistan", currency: "PKR", currency_symbol: "₨", flag: "🇵🇰" },
  "new zealand": { name: "New Zealand", currency: "NZD", currency_symbol: "NZ$", flag: "🇳🇿" },
  "germany": { name: "Germany", currency: "EUR", currency_symbol: "€", flag: "🇩🇪" },
  "france": { name: "France", currency: "EUR", currency_symbol: "€", flag: "🇫🇷" },
  "italy": { name: "Italy", currency: "EUR", currency_symbol: "€", flag: "🇮🇹" },
  "spain": { name: "Spain", currency: "EUR", currency_symbol: "€", flag: "🇪🇸" },
  "netherlands": { name: "Netherlands", currency: "EUR", currency_symbol: "€", flag: "🇳🇱" },
};

function resolveCountryFromUrl(urlCountry: string | null): Country | null {
  if (!urlCountry) return null;
  const key = urlCountry.toLowerCase();
  const entry = CURRENCY_MAP[key];
  if (!entry) return null;
  return { id: 0, ...entry };
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL so the first render already has the right country
  // and currency (avoids flash AND avoids a blank waiting state).
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    () => resolveCountryFromUrl(searchParams.get('country'))
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

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

        let storedCountry: Country | null = null;
        try {
          const stored = localStorage.getItem('selected_country_obj');
          if (stored) storedCountry = JSON.parse(stored) as Country;
        } catch {}

        if (storedCountry) {
          const stillValid = data.find((c: Country) => c.id === storedCountry!.id);
          if (stillValid) {
            setSelectedCountry(stillValid);
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
