import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { getProductBySlug, Product } from "@/lib/data";
import ItemQuantitySelector from "@/components/ItemQuantitySelector";
import ScrollAnimation from "@/components/ScrollAnimation";
import ProductGallery from "@/components/ProductGallery";
import SEO from "@/components/SEO";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const fetched = await getProductBySlug(slug);
        if (active) {
          setProduct(fetched);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-black text-stone-900 mb-2">Product Not Found</h2>
        <p className="text-stone-500 mb-6">The menu item you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="px-6 py-3 bg-orange-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:bg-orange-500 transition-all shadow-md shadow-orange-600/20">
          Browse Menu
        </Link>
      </div>
    );
  }

  const basePrice = product.variants && product.variants.length > 0
    ? product.variants[0].price
    : product.pricePerKg || 0;

  const productImageUrl = product.image
    ? (product.image.startsWith("http") ? product.image : `https://golekhajaghar.com${product.image}`)
    : "https://golekhajaghar.com/images/hero_bg.jpg";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": productImageUrl,
    "description": product.description || `${product.name} prepared fresh with authentic Nepali spices at Gole Khaja Ghar in Sisuwa, Pokhara-30.`,
    "brand": {
      "@type": "Brand",
      "name": "Gole Khaja Ghar"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://golekhajaghar.com/shop/${product.slug}`,
      "priceCurrency": "NPR",
      "price": basePrice,
      "availability": product.isAvailable !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Restaurant",
        "name": "Gole Khaja Ghar"
      }
    }
  };

  return (
    <div className="bg-white min-h-screen pt-8 md:pt-12 pb-20 w-full relative z-10 flex-grow flex flex-col">
      <SEO
        title={`${product.name} | Gole Khaja Ghar Pokhara`}
        description={`Order fresh ${product.name} (Rs. ${basePrice}) from Gole Khaja Ghar in Sisuwa, Pokhara-30. Authentic taste, hygienic preparation & fast delivery in Pokhara.`}
        canonical={`https://golekhajaghar.com/shop/${product.slug}`}
        ogType="restaurant.menu_item"
        ogImage={productImageUrl}
        keywords={`${product.name}, ${product.name} Pokhara, order ${product.name}, Gole Khaja Ghar, Sisuwa food`}
        schema={productSchema}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Back Button */}
        <Link to="/shop" className="inline-flex items-center text-stone-500 hover:text-black mb-8 transition-colors font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Image Gallery */}
          <ScrollAnimation>
            <ProductGallery
              images={[product.image, ...(product.images || [])].filter(Boolean)}
              productName={product.name}
              isAvailable={product.isAvailable}
            />
          </ScrollAnimation>

          {/* Right: Product Details */}
          <div className="flex flex-col">
            <ScrollAnimation delay={0.1}>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mb-2">
                {product.category || "Nepali Khaja"}
              </span>
              <h1 className="text-[28px] md:text-5xl font-black text-[#111111] leading-tight mb-2">
                {product.name}
              </h1>
              
              <div className="text-[22px] md:text-2xl font-bold text-stone-900 mb-4 flex items-end gap-1">
                Rs. {basePrice} {product.variants && product.variants.length > 1 && <span className="text-stone-500 text-lg md:text-base font-medium mb-[2px]">onwards</span>}
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="flex items-center text-stone-600 text-xs font-bold rounded-full bg-orange-50 px-3 py-1.5 border border-orange-100">
                  <span className="w-4 h-4 rounded-full bg-orange-200 flex items-center justify-center mr-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </span>
                  Freshly Prepared
                </span>
                <span className="flex items-center text-stone-600 text-xs font-bold rounded-full bg-green-50 px-3 py-1.5 border border-green-100">
                  <span className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center mr-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-700" />
                  </span>
                  Hygienic & Clean
                </span>
              </div>
            </ScrollAnimation>

            {/* Quantity Selector & Add to Order Client Component */}
            <ScrollAnimation delay={0.2} className="mt-2">
              <ItemQuantitySelector 
                product={product} 
                isAvailable={product.isAvailable} 
              />
            </ScrollAnimation>
            
            <ScrollAnimation delay={0.3} className="mt-8 pt-8 border-t border-stone-100">
              <h3 className="font-bold text-black mb-3 text-[15px]">About this dish</h3>
              <p className="text-stone-600 text-[14px] leading-relaxed mb-6">
                {product.description || "Authentic Nepali recipe prepared fresh with traditional spices and quality ingredients."}
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 mt-0.5"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
                  <p className="text-[14px] text-stone-600"><span className="font-bold text-black">Style:</span> Authentic Nepali Khaja</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 mt-0.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p className="text-[14px] text-stone-600"><span className="font-bold text-black">Preparation:</span> Made to Order</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </div>
  );
}
