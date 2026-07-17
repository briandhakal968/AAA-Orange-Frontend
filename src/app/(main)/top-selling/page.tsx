import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";

interface Product {
  id: number;
  category_id?: number;
  name: string;
  slug?: string;
  description: string;
  price: number;
  sale_price?: number | null;
  image: string;
  stock: number;
  sku: string;
  status?: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  prices?: { country_id: number; price: number; stock: number; available: boolean }[];
  average_rating?: number;
  reviews_count?: number;
}

async function getTopSellingProducts(): Promise<Product[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/products/top-selling?limit=12`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function TopSellingPage() {
  const products = await getTopSellingProducts();

  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Top Selling</h1>
          <p className="text-sm text-gray-500 mt-2">Our most popular products based on sales</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No top selling products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
