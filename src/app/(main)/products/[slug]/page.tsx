import { Metadata } from "next";
import { getProduct } from "@/lib/products";
import ProductDetailClient from "./product-detail-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.aaaorange.com';

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string }>;
}

async function getCountryFromUrl(countryName: string | undefined): Promise<Country | null> {
  if (!countryName) return null;
  try {
    const res = await fetch(`${API_URL}/api/countries`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const countries: Country[] = await res.json();
    return countries.find((c) => c.name.toLowerCase() === countryName.toLowerCase()) || null;
  } catch {
    return null;
  }
}

async function getTypography(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`${API_URL}/api/typography`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  try {
    const product = await getProduct(params.slug);
    return {
      title: `${product.name} | AAA Orange`,
      description: product.description?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
      openGraph: {
        title: product.name,
        description: product.description?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
        images: product.image ? [{ url: product.image }] : [],
      },
    };
  } catch {
    return { title: "Product | AAA Orange" };
  }
}

export default async function ProductDetailPage(props: PageProps) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const [product, initialCountry, initialTypography] = await Promise.all([
    getProduct(params.slug),
    getCountryFromUrl(searchParams.country),
    getTypography(),
  ]);
  return <ProductDetailClient initialProduct={product} initialCountry={initialCountry} initialTypography={initialTypography} />;
}
