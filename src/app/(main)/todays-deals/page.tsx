import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.aaaorange.com";

export const metadata: Metadata = {
  title: "Today's Deals | AAA Orange",
  description: "Special offers with discounted prices",
};

async function getTodaysDeals() {
  try {
    const res = await fetch(`${API_URL}/api/todays-deals`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DealsPage() {
  const products = await getTodaysDeals();

  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Today&apos;s Deals</h1>
          <p className="text-sm text-gray-500 mt-2">Special offers with discounted prices</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No deals available right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
