"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { ReviewsList } from "@/components/ui/reviews-list";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAlert } from "@/components/ui/alert-modal";
import { useCountry } from "@/context/country-context";
import { isProductAvailableInCountry } from "@/lib/products";
import type { AdditionalInfoItem } from "@/lib/products";
import { ProductCard } from "@/components/ui/product-card";
import type { Product } from "@/lib/products";

interface ProductAttribute {
  id: number;
  attribute_id: number;
  attribute_value_id: number;
  value?: string;
  color?: string | null;
  attribute?: {
    id: number;
    name: string;
    type: string;
  };
}

export default function ProductDetailClient({ initialProduct }: { initialProduct: Product }) {
  const productSlug = initialProduct.slug;
  const [product, setProduct] = useState<Product>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addItem, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const { showAlert } = useAlert();
  const { selectedCountry } = useCountry();
  const router = useRouter();
  const currencySymbol = selectedCountry?.currency_symbol || '$';

  const productAttributes = (product?.attributes as ProductAttribute[]) || [];
  const groupedAttributes: Record<string, ProductAttribute[]> = {};
  productAttributes.forEach((attr) => {
    const name = attr.attribute?.name || 'Attribute';
    if (!groupedAttributes[name]) {
      groupedAttributes[name] = [];
    }
    groupedAttributes[name].push(attr);
  });

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "long_description" | "reviews">("reviews");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const tabsRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && galleryImages.length > 1) {
      handleThumbnailClick(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1);
    } else if (isRightSwipe && galleryImages.length > 1) {
      handleThumbnailClick(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1);
    }
  };

  const countryPrice = product?.prices?.find(
    (p) => p.country_id === selectedCountry?.id
  );
  const displayPrice = Number(countryPrice?.price ?? product?.price ?? 0);
  const displaySalePrice = countryPrice?.sale_price ? Number(countryPrice.sale_price) : (product?.sale_price ? Number(product.sale_price) : null);
  const displayStock = countryPrice?.stock ?? product?.stock ?? 0;
  const discount = displaySalePrice && displayPrice > 0 ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100) : 0;

  const galleryImages = product ? ((product as any)?.gallery?.length > 0
    ? [(product as any).image, ...(product as any).gallery.map((g: any) => g.image)]
    : [(product as any).image]) : [];

  const getShareData = () => {
    if (!product) return { priceText: '', shareText: '', imageUrl: '' };
    const price = displaySalePrice || displayPrice;
    const priceText = `${currencySymbol}${price}`;
    const shareText = `${product.name} - ${priceText}\n${product.description?.replace(/<[^>]*>/g, '').substring(0, 150)}...`;
    const imageUrl = galleryImages[0] || '';
    return { priceText, shareText, imageUrl };
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const attrKeys = Object.keys(groupedAttributes);
    if (attrKeys.length > 0 && Object.keys(selectedAttributes).length < attrKeys.length) {
      showAlert("Please select all options", "warning");
      return;
    }
    if (selectedCountry?.id && !isProductAvailableInCountry(product, selectedCountry.id)) {
      showAlert("This product is not available in your country", "warning");
      return;
    }
    if (displayStock <= 0) {
      showAlert("This product is out of stock", "warning");
      return;
    }
    const sizeAttrKey = Object.keys(selectedAttributes).find(k => k !== 'Color');
    const sizeValue = sizeAttrKey ? selectedAttributes[sizeAttrKey] : "M";
    const colorValue = selectedAttributes['Color'] || undefined;
    addItem(product, sizeValue, quantity, colorValue);
    setAddedToCart(true);
    setIsOpen(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const attrKeys = Object.keys(groupedAttributes);
    if (attrKeys.length > 0 && Object.keys(selectedAttributes).length < attrKeys.length) {
      showAlert("Please select all options", "warning");
      return;
    }
    if (selectedCountry?.id && !isProductAvailableInCountry(product, selectedCountry.id)) {
      showAlert("This product is not available in your country", "warning");
      return;
    }
    if (displayStock <= 0) {
      showAlert("This product is out of stock", "warning");
      return;
    }
    const sizeAttrKey = Object.keys(selectedAttributes).find(k => k !== 'Color');
    const sizeValue = sizeAttrKey ? selectedAttributes[sizeAttrKey] : "M";
    const colorValue = selectedAttributes['Color'] || undefined;
    addItem(product, sizeValue, 1, colorValue);
    router.push("/checkout");
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedImage(index);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  useEffect(() => {
    setSelectedImage(0);
  }, [productSlug]);

  useEffect(() => {
    if (product?.slug) {
      const fetchRelated = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.aaaorange.com';
          const response = await fetch(`${API_URL}/api/products/${product.slug}/related`);
          if (response.ok) {
            const data = await response.json();
            setRelatedProducts(data.sort(() => Math.random() - 0.5));
          }
        } catch {
          // ignore
        } finally {
          setLoadingRelated(false);
        }
      };
      fetchRelated();
    }
  }, [product?.slug]);

  return (
    <main className="flex-1">
      <Container>
        <div className="py-8 md:py-12">
          <nav className="mb-6 text-xs text-neutral-400">
            <Link href="/shop" className="hover:text-black transition-colors">
              Shop
            </Link>
            <span className="mx-2">/</span>
            <span className="text-black">{product.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 items-start">
            <div className="space-y-4">
              <div className="relative group" ref={imageContainerRef}>
                <div
                  className="relative aspect-square bg-neutral-50 overflow-hidden rounded-[15px] border border-neutral-200 max-h-[70vh] md:max-h-none"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    src={galleryImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-grab active:cursor-grabbing transition-opacity duration-200"
                    onClick={() => setIsModalOpen(true)}
                  />

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() => handleThumbnailClick(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleThumbnailClick(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </button>
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {galleryImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`relative flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-black" : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  {product.category?.name || 'Uncategorized'}
                </p>
                <h1 className="text-2xl md:text-3xl font-light tracking-tight text-black mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {displaySalePrice && displaySalePrice < displayPrice ? (
                    <>
                      <p className="text-xl md:text-2xl text-[var(--primary)] font-medium">
                        {currencySymbol}{displaySalePrice.toFixed(2)}
                      </p>
                      <p className="text-lg text-neutral-400 line-through">
                        {currencySymbol}{displayPrice.toFixed(2)}
                      </p>
                      {discount > 0 && (
                        <span className="text-xs font-medium text-white bg-[var(--primary)] px-2 py-1 rounded">
                          {discount}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xl md:text-2xl text-black">
                      {currencySymbol}{Number(displayPrice).toFixed(2)}
                      {selectedCountry?.currency && selectedCountry.currency !== 'USD' && (
                        <span className="text-sm text-neutral-400 ml-2">({selectedCountry.currency})</span>
                      )}
                    </p>
                  )}
                </div>
                <p className={`text-sm mt-2 ${displayStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {displayStock > 0 ? 'In Stock' : 'Out of Stock'}
                  {displayStock > 0 && ` (${displayStock} available)`}
                </p>

                {(product.average_rating ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={star <= Math.round(product.average_rating ?? 0) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className={star <= Math.round(product.average_rating ?? 0) ? "text-yellow-400" : "text-neutral-300"}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-neutral-700 font-medium">
                      {product.average_rating?.toFixed(1)}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab("reviews");
                        setTimeout(() => {
                          tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="text-xs text-neutral-500 hover:text-black transition-colors"
                    >
                      ({product.reviews_count || 0} reviews) See all
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-3 mb-[20px]">
                <RichTextContent html={(() => {
                  const desc = product.description || '';
                  if (!desc) return '';
                  if (/<[a-z][\s\S]*>/i.test(desc)) return desc.replace(/<ul>/g, '<ul class="list-disc pl-6">').replace(/<ol>/g, '<ol class="list-decimal pl-6">');
                  return `<p>${desc}</p>`;
                })()} />
              </div>

              {Object.entries(groupedAttributes).map(([name, attrs]) => {
                const isColorAttr = name === "Color" || name === "colour" || name === "Colour";
                const colorMap: Record<string, string> = isColorAttr ? {
                  'Black': '#000000', 'White': '#FFFFFF', 'Brown': '#8B4513',
                  'Beige': '#F5F5DC', 'Navy': '#000080', 'Red': '#FF0000',
                  'Blue': '#0000FF', 'Green': '#008000', 'Yellow': '#FFFF00',
                  'Pink': '#FFC0CB', 'Grey': '#808080', 'Gray': '#808080',
                  'Orange': '#FFA500', 'Purple': '#800080',
                } : {};
                const selectedValue = selectedAttributes[name];
                return (
                  <div className="mb-4" key={name}>
                    <span className="text-sm text-neutral-500 mb-2 block">
                      {name}: {selectedValue || ''}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                    {attrs.map((attr, idx) => {
                      const isSelected = selectedAttributes[name] === attr.value;
                      if (isColorAttr) {
                        const colorValue = colorMap[attr.value?.toString() || ''] || attr.color || '#cccccc';
                        return (
                          <button
                            key={`${attr.attribute_id}-${attr.value}-${idx}`}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [name]: attr.value || "" }))}
                            className={`w-8 h-8 rounded-[10px] border border-neutral-300 transition-all ${isSelected ? "ring-2 ring-black ring-offset-1" : "hover:ring-2 hover:ring-neutral-300 hover:ring-offset-1"}`}
                            style={{ backgroundColor: colorValue }}
                            title={attr.value}
                          />
                        );
                      }
                      return (
                        <button
                          key={`${attr.attribute_id}-${attr.value}-${idx}`}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [name]: attr.value || "" }))}
                          className={`h-8 px-3 text-sm border transition-all rounded-[10px] ${isSelected ? "border-black bg-black text-white" : "border-neutral-200 hover:border-black"}`}
                        >
                          {attr.value}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-3 mb-6">
                <div className="flex items-center border border-neutral-200 rounded-[15px] overflow-hidden">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-sm hover:bg-neutral-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-3 py-2 text-sm hover:bg-neutral-100 transition-colors"
                    disabled={quantity >= displayStock}
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="lg"
                  disabled={displayStock === 0}
                  className={`flex-1 rounded-[15px] ${
                    addedToCart ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                >
                  {displayStock === 0 ? "Out of Stock" : addedToCart ? "Added to Cart" : "Add to Cart"}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="primary"
                  size="lg"
                  disabled={displayStock === 0}
                  className="flex-1 rounded-[15px] hover:opacity-90" style={{ backgroundColor: '#f59e0b' }}
                >
                  {displayStock === 0 ? "Out of Stock" : "Buy Now"}
                </Button>
              </div>

              <WishlistButton productId={product.id} size="lg" showLabel={true} />

              <div className="pb-[10px]"></div>

              <div className="border-t border-neutral-200 pt-6 space-y-4 mb-8">
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Free shipping on orders over {currencySymbol}500
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M1 10h22" />
                  </svg>
                  30-day return policy
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Authentic luxury products
                </div>

               </div>
              </div>
            </div>
          </div>

        <div className="border-t border-neutral-200 pt-6 mt-8" ref={tabsRef}>
         <div className="flex gap-6 border-b border-neutral-200 mb-6">
           {(product as any)?.long_description && (
             <button
               onClick={() => setActiveTab("long_description")}
               className={`pb-3 text-sm font-medium transition-colors relative ${
                 activeTab === "long_description"
                   ? "text-black"
                   : "text-neutral-500 hover:text-black"
               }`}
             >
               Description
               {activeTab === "long_description" && (
                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
               )}
             </button>
           )}
           <button
             onClick={() => setActiveTab("details")}
             className={`pb-3 text-sm font-medium transition-colors relative ${
               activeTab === "details"
                 ? "text-black"
                 : "text-neutral-500 hover:text-black"
             }`}
           >
             Additional Information
             {activeTab === "details" && (
               <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
             )}
           </button>
           <button
             onClick={() => setActiveTab("reviews")}
             className={`pb-3 text-sm font-medium transition-colors relative ${
               activeTab === "reviews"
                 ? "text-black"
                 : "text-neutral-500 hover:text-black"
             }`}
           >
             Reviews ({product.reviews_count || 0})
             {activeTab === "reviews" && (
               <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
             )}
           </button>
         </div>

        {activeTab === "details" && (
          <div>
            <div className="bg-neutral-50 rounded-lg p-5">
              <table className="w-full">
                <tbody>
                  {(product.additional_info || []).map((info: AdditionalInfoItem, index: number, arr: AdditionalInfoItem[]) => (
                    <tr key={info.label} className={index !== arr.length - 1 ? "border-b border-neutral-200" : ""}>
                      <td className="py-3 pr-8 text-sm font-medium text-neutral-700 w-2/5">
                        {info.label}
                      </td>
                      <td className="py-3 text-sm text-neutral-600">
                        {info.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "long_description" && (
          <div>
            <RichTextContent html={(product as any)?.long_description || ''} />
          </div>
        )}

        {activeTab === "reviews" && (
          <ReviewsList productId={(product as any)?.id || 0} />
        )}
      </div>
      </Container>

      {!loadingRelated && relatedProducts.length > 0 && (
        <Container>
          <div className="mt-16 pt-8 border-t border-neutral-200">
            <h2 className="text-xl md:text-2xl font-light mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct: Product) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        </Container>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleThumbnailClick(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleThumbnailClick(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div
            className="relative w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {galleryImages.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {galleryImages.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); handleThumbnailClick(index); }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedImage === index ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute bottom-4 right-4 text-white text-sm z-10">
                {selectedImage + 1} / {galleryImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
