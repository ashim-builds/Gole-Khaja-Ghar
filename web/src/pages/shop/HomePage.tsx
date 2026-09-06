import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  Star,
  Award,
  MapPin,
  ShoppingBag,
  Scale,
  ShoppingCart,
  ClipboardList,
  Bike
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ScrollAnimation from "@/components/ScrollAnimation";
import { getFeaturedProducts, Product } from "@/lib/data";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const products = await getFeaturedProducts();
        if (active) {
          setFeaturedProducts(products);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col bg-background">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden min-h-[500px] md:min-h-[640px] flex items-center bg-[#0c0c0c]">
        {/* Desktop Background image */}
        <img
          src="/images/hero_bg.png"
          alt="Bowl of crunchy spicy chips"
          className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
        />
        {/* Mobile Background image */}
        <img
          src="/images/hero_bg_mobile.jpg"
          alt="Bowl of crunchy spicy chips"
          className="absolute inset-0 w-full h-full object-cover object-right block md:hidden"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent md:to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="w-[85%] md:w-1/2 flex flex-col items-start text-left pt-8 md:pt-0">
            <h1
              className="uppercase text-[3rem] leading-[1] md:text-[4.75rem] font-black tracking-tight mb-2 md:mb-4"
              style={{ fontFamily: "'Anton', 'Archivo Black', system-ui, sans-serif" }}
            >
              <span className="text-white block">Authentic.</span>
              <span className="text-primary block">Delicious.</span>
              <span className="text-white block">Fresh.</span>
            </h1>
            <p className="hidden md:block text-base md:text-lg text-white/90 mb-8 max-w-[340px] font-medium leading-snug">
              Taste the authentic flavors of Nepal. Freshly prepared Khaja sets, momos, chowmein, and local delicacies.
            </p>
            <Link
              to="/shop"
              className="px-6 py-2.5 md:px-8 md:py-3 bg-primary text-black font-extrabold rounded md:rounded-md hover:bg-primary/90 transition-all text-sm tracking-wide shadow-lg mt-4 md:mt-0"
            >
              EXPLORE MENU
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES */}
      <ScrollAnimation>
        <section className="hidden md:block bg-[#111111] border-y border-[#2a2a2a] py-6 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:flex items-center justify-between gap-y-8 md:gap-0">
              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">Freshly Prepared</p>
                  <p className="text-white/60 text-[11px] md:text-xs">Hygienic & Clean</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">Authentic Taste</p>
                  <p className="text-white/60 text-[11px] md:text-xs">100% Traditional</p>
                </div>
              </div>

              {/* Desktop Center Divider */}
              <div className="hidden md:block w-[1px] h-12 bg-[#333333] mx-4"></div>

              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <Truck className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">Fast Delivery</p>
                  <p className="text-white/60 text-[11px] md:text-xs">Hot to Your Door</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">Dine-in & Pick-up</p>
                  <p className="text-white/60 text-[11px] md:text-xs">Visit Our Restaurant</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* LOWER PAGE CONTENT */}
      <div className="bg-white w-full flex-grow flex flex-col relative z-10">
        
        {/* 3. CATEGORIES & TOP PICKS SECTION */}
        <ScrollAnimation delay={0.1}>
          <section id="shop" className="pt-6 pb-12 md:pt-16 md:pb-32 w-full max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8">
            
            {/* Mobile Header */}
            <div className="flex md:hidden justify-between items-center px-4 mb-4 mt-4">
              <h2 className="text-lg font-black text-black uppercase tracking-wider">Top Menu Picks</h2>
              <Link to="/shop" className="text-[13px] text-stone-600 hover:text-primary font-semibold">View all</Link>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex flex-col items-center mb-12">
              <h2 className="text-4xl font-black text-[#111111] uppercase tracking-tight">Popular Dishes</h2>
              <svg width="60" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-4">
                 <path d="M0 6C3 6 5 2 10 2C15 2 15 10 20 10C25 10 25 2 30 2C35 2 37 6 40 6" stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Responsive Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 bg-[#fafafa] md:bg-transparent">
                {featuredProducts.slice(0, 8).map((product, index) => (
                  <div key={product.id} className={index >= 3 ? "hidden md:block" : ""}>
                    <ProductCard 
                      id={product.id} 
                      slug={product.slug} 
                      name={product.name} 
                      pricePerKg={product.pricePerKg} 
                      image={product.image} 
                      category={product.category}
                      isAvailable={product.isAvailable}
                      variants={product.variants}
                      priceType={product.priceType}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* View All Button */}
            <div className="flex justify-center mt-10 md:mt-12">
              <Link to="/shop" className="bg-primary hover:bg-primary/90 text-black font-black text-[13px] uppercase tracking-wider px-8 py-3 rounded-md transition-colors shadow-sm">
                VIEW FULL MENU
              </Link>
            </div>
          </section>
        </ScrollAnimation>

        {/* 4. PROCESS BANNER */}
        <ScrollAnimation delay={0.2} className="mt-auto">
          <section className="bg-primary w-full py-10 md:py-12 border-t-[8px] md:border-t-[10px] border-primary rounded-t-[2.5rem] md:rounded-t-[3rem] -mt-[2rem] md:-mt-[3rem] relative z-20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-10 md:gap-0">
              <div className="w-full md:w-[35%] text-center md:text-left flex flex-col items-center md:items-start">
                <h2 className="text-[28px] md:text-[2.2rem] lg:text-4xl font-black text-[#111111] uppercase leading-[1.1] tracking-tight">
                  Order Your Favorite<br className="hidden md:block"/>Khaja Easily
                </h2>
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-3 md:mt-4">
                   <path d="M0 6C3 6 5 2 10 2C15 2 15 10 20 10C25 10 25 2 30 2C35 2 37 6 40 6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between w-full md:flex-grow md:pl-8 lg:pl-12 gap-y-8 gap-x-2 md:gap-2">
                {[
                  { title: "Browse Menu", icon: <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-black" /> },
                  { title: "Select Portion", icon: <Scale className="w-6 h-6 md:w-8 md:h-8 text-black" /> },
                  { title: "Add to Cart", icon: <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-black" /> },
                  { title: "Place Order", icon: <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-black" /> },
                  { title: "Fresh Delivery", icon: <Bike className="w-6 h-6 md:w-8 md:h-8 text-black" /> },
                ].map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-center text-center gap-3 w-[30%] md:w-auto md:min-w-0 flex-shrink-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {step.icon}
                      </div>
                      <span className="font-bold text-black text-[11px] md:text-xs lg:text-sm leading-tight">{step.title}</span>
                    </div>
                    {index < 4 && (
                      <ArrowRight className="hidden md:block w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 text-black mb-8 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
        </ScrollAnimation>
      </div>
    </div>
  );
}
