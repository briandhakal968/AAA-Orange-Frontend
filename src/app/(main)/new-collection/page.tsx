import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.aaaorange.com";

export const metadata: Metadata = {
  title: "New Collection | AAA Orange",
  description: "Check out our latest arrivals",
};

async function getNewProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products?limit=12&is_active=true&sort=newest`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || data || [];
  } catch {
    return [];
  }
}

export default async function NewCollectionPage() {
  const products = await getNewProducts();

  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">New Collection</h1>
          <p className="text-sm text-gray-500 mt-2">Check out our latest arrivals</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Container>
  );
}
