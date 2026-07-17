import { Suspense } from "react";
import Link from "next/link";
import { HeroSlider } from "@/components/layout/hero-slider";
import { CategorySlider } from "@/components/sections/category-slider";
import { ProductGridSection } from "@/components/sections/product-grid-section";
import { ProductSlider } from "@/components/sections/product-slider";
import { DynamicSection } from "./dynamic-section";
import type { Product } from "@/lib/products";

interface HomeSection {
  id: number;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  link: string | null;
  button_text: string | null;
  position: number;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  items?: HomeSectionItem[];
  product_id?: number | null;
}

interface HomeSectionItem {
  id: number;
  home_section_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  link: string | null;
  price: number | null;
  sale_price: number | null;
  badge: string | null;
  button_text: string | null;
  position: number;
  product_id: number | null;
  meta: Record<string, unknown> | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  position: number;
  image?: string;
}

interface CategorySectionItem {
  id: number;
  title: string;
  image: string;
  link: string;
}

interface CategorySection {
  id: number;
  title: string | null;
  subtitle: string | null;
  items: CategorySectionItem[];
}

interface HeroSlide {
  id: number;
  image: string | null;
  title: string | null;
  description: string | null;
  link: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getHomeSections(): Promise<HomeSection[]> {
  try {
    const res = await fetch(`${API_URL}/api/home-sections`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.filter((c: Category) => !c.parent_id);
  } catch {
    return [];
  }
}

async function filterHeroSlides(sections: HomeSection[]): Promise<HeroSlide[]> {
  const heroSection = sections.find(s => s.section_key === "hero");
  if (!heroSection?.items || heroSection.items.length === 0) return [];
  return heroSection.items
    .filter(item => item.image && (item.image.startsWith('http://') || item.image.startsWith('https://')))
    .map(item => ({
      id: item.id,
      image: item.image,
      title: item.title,
      description: item.description,
      link: item.link,
    }));
}

async function getProducts(): Promise<Product[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/products?limit=12&is_active=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || data || [];
  } catch {
    return [];
  }
}

function HeroSection() {
  return (
    <Suspense fallback={<div className="relative h-[18vh] md:h-[50vh] lg:h-[60vh] w-full bg-neutral-100 animate-pulse" />}>
      <HeroSliderAsync />
    </Suspense>
  );
}

async function HeroSliderAsync() {
  const sections = await getHomeSections();
  const heroSlides = await filterHeroSlides(sections);
  return <HeroSlider slides={heroSlides} />;
}

async function HomeSectionsAsync() {
  const [sections, categories, products] = await Promise.all([
    getHomeSections(),
    getCategories(),
    getProducts(),
  ]);

  const categorySection = sections.find(s => s.section_key === "category") as unknown as CategorySection | undefined;
  const promoBannerSection = sections.find(s => (s.section_key === "banner" || s.section_key === "promo_banner") && s.is_active);
  const fullWidthBannerSection = sections.find(s => s.section_key === "full_width_banner" && s.is_active);
  const productGridSection = sections.find(s => s.section_key === "product_grid" && s.is_active);
  const productSliderSection = sections.find(s => s.section_key === "product_slider" && s.is_active);
  const psSettings = typeof productSliderSection?.settings === "string" ? JSON.parse(productSliderSection.settings) : productSliderSection?.settings;
  const psCategoryId = psSettings?.category_id ? Number(psSettings.category_id) : null;
  const sliderProducts = psCategoryId ? products.filter(p => p.category_id === psCategoryId) : products;

  const secondProductSliderSection = sections.find(s => s.section_key === "second_product_slider" && s.is_active);
  const spsSettings = typeof secondProductSliderSection?.settings === "string" ? JSON.parse(secondProductSliderSection.settings) : secondProductSliderSection?.settings;
  const spsCategoryId = spsSettings?.category_id ? Number(spsSettings.category_id) : null;
  const secondSliderProducts = spsCategoryId ? products.filter(p => p.category_id === spsCategoryId) : products;

  const secondProductGridSection = sections.find(s => s.section_key === "second_product_grid" && s.is_active);

  return (
    <>
      <div className="mb-10">
        <CategorySlider
          categories={categories}
          categorySection={categorySection ? { ...categorySection, subtitle: null } : null}
        />
      </div>

      <div className="mb-10">
        {(() => {
          const gridSettings = typeof productGridSection?.settings === "string" ? JSON.parse(productGridSection.settings) : productGridSection?.settings;
          return (
            <ProductGridSection
              title={productGridSection?.title || "Latest Collection"}
              limit={8}
              filter={String(gridSettings?.filter || "latest")}
            />
          );
        })()}
      </div>

      <div className="mb-10">
        {promoBannerSection ? (
          <DynamicSection section={promoBannerSection} />
        ) : null}
      </div>

      <div className="mb-10">
        <ProductSlider
          products={sliderProducts}
          heading={productSliderSection?.title || "Top Selling"}
        />
      </div>

      {fullWidthBannerSection ? (
          <section className="relative h-[50vh] md:h-[60vh] lg:h-[60vh] w-full overflow-hidden">
            <Link
              href={fullWidthBannerSection.items?.[0]?.link || "#"}
              className="block relative w-full h-full group"
            >
              <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: `url(${fullWidthBannerSection.items?.[0]?.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 md:pb-12 text-center px-4">
                {fullWidthBannerSection.items?.[0]?.badge && (
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-3">
                    {fullWidthBannerSection.items[0].badge}
                  </p>
                )}
                <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-light mb-2">
                  {fullWidthBannerSection.items?.[0]?.title}
                </h2>
                <p className="text-white/80 text-sm md:text-base mb-4 max-w-lg">
                  {fullWidthBannerSection.items?.[0]?.description}
                </p>
                <span className="text-white text-sm md:text-base underline underline-offset-4 decoration-white/60 group-hover:decoration-white transition-colors">
                  {fullWidthBannerSection.items?.[0]?.button_text || "Shop Now"}
                </span>
              </div>
            </Link>
          </section>
        ) : null}
      </div>

      <div className="mb-10">
        <ProductSlider
          products={secondSliderProducts}
          heading={secondProductSliderSection?.title || "New Collection"}
        />
      </div>

      <div className="mb-10">
        {(() => {
          const spgSettings = typeof secondProductGridSection?.settings === "string" ? JSON.parse(secondProductGridSection.settings) : secondProductGridSection?.settings;
          return (
            <ProductGridSection
              title={secondProductGridSection?.title || "Latest Collection"}
              filter={String(spgSettings?.filter || "latest")}
              enableLoadMore
            />
          );
        })()}
      </div>
    </>
  );
}

export default async function Home() {
  return (
    <main className="flex-1">
      <div className="mb-10">
        <HeroSection />
      </div>

      <Suspense fallback={<div className="max-w-[1600px] mx-auto px-4 md:px-6"><div className="h-10 bg-neutral-100 rounded animate-pulse mb-4" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-square bg-neutral-100 rounded-lg animate-pulse"/>)}</div></div>}>
        <HomeSectionsAsync />
      </Suspense>
    </main>
  );
}
