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
      cache: "no-store",
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
    const res = await fetch(`${API_URL}/api/products?limit=12&is_active=true`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || data || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [sections, categories, products] = await Promise.all([
    getHomeSections(),
    getCategories(),
    getProducts(),
  ]);

  const heroSlides = await filterHeroSlides(sections);
  const categorySection = sections.find(s => s.section_key === "category") as unknown as CategorySection | undefined;
  
  // Banner sections managed from admin
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

  const otherSections = sections.filter(s =>
    s.section_key !== "hero" &&
    s.section_key !== "banner" &&
    s.section_key !== "promo_banner" &&
    s.section_key !== "full_width_banner" &&
    s.section_key !== "product_grid" &&
    s.section_key !== "product_slider" &&
    s.section_key !== "second_product_slider" &&
    s.section_key !== "second_product_grid" &&
    s.is_active
  ).sort((a, b) => a.position - b.position);

  return (
    <main className="flex-1">
      <div className="mb-10">
        <HeroSlider slides={await heroSlides} />
      </div>

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
        ) : (
          <section>
            <div className="max-w-[1600px] mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3 lg:gap-4">
                <Link href="/summer-collection" className="block relative overflow-hidden rounded-xl aspect-[3/2] group">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43c?w=800&q=80"
                    alt="Summer Collection"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center">
                    <div className="p-8 md:p-12">
                      <p className="text-white/80 text-xs uppercase tracking-wider mb-2">New Arrivals</p>
                      <h3 className="text-white text-2xl md:text-4xl font-light mb-4">Summer<br/>Collection</h3>
                      <span className="inline-block text-white text-sm border border-white/40 px-5 py-2.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                        Shop Now
                      </span>
                    </div>
                  </div>
                </Link>
                <Link href="/accessories" className="block relative overflow-hidden rounded-xl aspect-[3/2] group">
                  <img
                    src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80"
                    alt="Accessories"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center">
                    <div className="p-8 md:p-12">
                      <p className="text-white/80 text-xs uppercase tracking-wider mb-2">Complete Your Look</p>
                      <h3 className="text-white text-2xl md:text-4xl font-light mb-4">Style<br/>Essentials</h3>
                      <span className="inline-block text-white text-sm border border-white/40 px-5 py-2.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                        Shop Now
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="mb-10">
        <ProductSlider
          products={sliderProducts}
          heading={productSliderSection?.title || "Top Selling"}
        />
      </div>

      <div className="mb-10">
        {fullWidthBannerSection ? (
          <section className="relative h-screen w-full overflow-hidden">
            <Link
              href={fullWidthBannerSection.items?.[0]?.link || "#"}
              className="block relative w-full h-full group"
            >
              <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: `url(${fullWidthBannerSection.items?.[0]?.image || "https://images.unsplash.com/photo-1445205176230-a4d268678d6f?w=1600&q=80"})` }}
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
        ) : (
          <section className="relative h-screen w-full overflow-hidden">
            <Link href="/new-collection" className="block relative w-full h-full group">
              <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1445205176230-a4d268678d6f?w=1600&q=80)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 md:pb-12 text-center px-4">
                <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-light mb-2">
                  Discover the New Collection
                </h2>
                <p className="text-white/80 text-sm md:text-base mb-4 max-w-lg">
                  Explore the latest trends and elevate your style
                </p>
                <span className="text-white text-sm md:text-base underline underline-offset-4 decoration-white/60 group-hover:decoration-white transition-colors">
                  Shop Now
                </span>
              </div>
            </Link>
          </section>
        )}
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

    </main>
  );
}
