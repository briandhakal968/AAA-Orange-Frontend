import { Metadata } from "next";
import { getProduct } from "@/lib/products";
import ProductDetailClient from "./product-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
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
  const params = await props.params;
  const product = await getProduct(params.slug);
  return <ProductDetailClient initialProduct={product} />;
}
