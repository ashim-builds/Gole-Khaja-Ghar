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
  Bike,
  Download,
  ChevronDown,
  Utensils,
  ShieldCheck,
  Flame,
  Clock,
  Phone,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ScrollAnimation from "@/components/ScrollAnimation";
import InstallAppSection from "@/components/InstallAppSection";
import SEO from "@/components/SEO";
import { getFeaturedProducts, Product } from "@/lib/data";

const homeFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where is Gole Khaja Ghar located in Pokhara?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Gole Khaja Ghar is located in Sisuwa, Pokhara-30, Kaski, Gandaki Province, Nepal. We are conveniently situated for dine-in, takeaway, and quick local delivery."
      }
    },
    {
      "@type": "Question",
      "name": "What are the most popular Nepali dishes at Gole Khaja Ghar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our popular offerings include authentic Nepali Khaja Sets (crispy chura, spiced bhatmas, and spicy achar), steaming Buff & Chicken Momos (Steam, Fried, and Jhol Momo), wok-tossed Chowmein, spicy Sekuwa, and crispy evening snacks."
      }
    },
    {
      "@type": "Question",
      "name": "Does Gole Khaja Ghar deliver food in Pokhara?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! We offer fast, hot home delivery across Pokhara-30 (Sisuwa, Lekhnath) and surrounding areas. You can order directly through our website."
      }
    },
    {
      "@type": "Question",
      "name": "What are your opening and closing hours?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We are open daily from 8:00 AM to 9:00 PM, serving breakfast, lunch, afternoon snacks, and dinner. Note that we are closed on the first Tuesday of every month."
      }
    },
    {
      "@type": "Question",
      "name": "How can I order food online from Gole Khaja Ghar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can browse our full menu on our website, customize portion sizes, add items to your cart, and place an order for delivery or pickup with cash or FonePay QR payment."
      }
    }
  ]
};

const faqs = [
  {
    question: "Where is Gole Khaja Ghar located in Pokhara?",
    answer:
      "Gole Khaja Ghar (गोल खाजा घर) is located in Sisuwa, Pokhara-30, Kaski, Nepal. We are easily accessible for dine-in meals, takeaway parcels, and fast home deliveries across the Lekhnath and Sisuwa area.",
  },
  {
    question: "What are your signature dishes and snacks?",
    answer:
      "Our most popular dishes include our signature Nepali Khaja Sets (crispy beaten rice, spiced bhatmas, tarkari, and homemade pickles), fresh juicy Momos (Buff & Chicken steam, fried, or jhol), wok-seared Chowmein, spicy Sekuwa, and delicious local snacks.",
  },
  {
    question: "Do you offer food delivery in Pokhara-30 and Sisuwa?",
    answer:
      "Yes, we provide fast local delivery across Sisuwa, Pokhara-30, and nearby Lekhnath neighborhoods. Orders are packed fresh and delivered hot to your doorstep.",
  },
  {
    question: "What are your business hours?",
    answer:
      "We are open daily from 8:00 AM to 9:00 PM. We are closed on the 1st Tuesday of every month for routine maintenance.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery / Dine-in cash payments as well as digital QR payments via FonePay and mobile banking apps.",
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

    // Check standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);

    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const handleHeroInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      const installSection = document.getElementById("install-app");
      if (installSection) {
        installSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col bg-background">
      {/* SEO Metadata & FAQ JSON-LD Schema */}
      <SEO
        title="Gole Khaja Ghar | Best Nepali Khaja, Momo & Restaurant in Pokhara (Sisuwa)"
        description="Authentic Nepali Khaja Ghar & Restaurant in Sisuwa, Pokhara-30. Taste fresh delicious momos, traditional khaja sets, chowmein, sekuwa & snacks. Dine-in, pickup & fast home delivery in Pokhara."
        keywords="Gole Khaja Ghar, गोल खाजा घर, khaja ghar pokhara, restaurant in sisuwa pokhara, best momo pokhara, nepali khaja set pokhara, khaja ghar sisuwa, food delivery pokhara 30, lekhnath khaja, authentic nepali food pokhara"
        canonical="https://golekhajaghar.com/"
        schema={homeFAQSchema}
      />

      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden min-h-[500px] md:min-h-[640px] flex items-center bg-[#0c0c0c]">
        {/* Desktop Background image */}
        <img
          src="/images/hero_bg.jpg"
          alt="Authentic Nepali Khaja and Momo Feast at Gole Khaja Ghar Pokhara"
          className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
        />
        {/* Mobile Background image */}
        <img
          src="/images/hero_bg_mobile.jpg"
          alt="Authentic Nepali Khaja and Momo Feast at Gole Khaja Ghar Pokhara"
          className="absolute inset-0 w-full h-full object-cover object-right block md:hidden"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent md:to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="w-[85%] md:w-1/2 flex flex-col items-start text-left pt-8 md:pt-0">
            <span className="inline-block text-orange-500 font-bold uppercase tracking-wider text-xs md:text-sm bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
              Sisuwa, Pokhara-30 • Authentic Taste
            </span>
            <h1
              className="uppercase text-[3rem] leading-[1] md:text-[4.75rem] font-black tracking-tight mb-2 md:mb-4"
              style={{
                fontFamily: "'Anton', 'Archivo Black', system-ui, sans-serif",
              }}
            >
              <span className="text-white block">Authentic.</span>
              <span className="text-primary block">Delicious.</span>
              <span className="text-white block">Fresh.</span>
            </h1>
            <p className="hidden md:block text-base md:text-lg text-white/90 mb-8 max-w-[360px] font-medium leading-snug">
              Taste the true flavors of Nepal. Freshly prepared Khaja sets,
              juicy momos, chowmein, and local delicacies in Sisuwa, Pokhara.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
              <Link
                to="/shop"
                className="px-6 py-2.5 md:px-8 md:py-3.5 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-500 transition-all text-sm tracking-wider uppercase shadow-xl shadow-orange-600/30 cursor-pointer"
              >
                EXPLORE MENU
              </Link>

              {!isInstalled && (
                <button
                  onClick={handleHeroInstall}
                  className="px-4 py-2.5 md:px-5 md:py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded md:rounded-md border border-white/20 transition-all text-sm flex items-center gap-2 backdrop-blur-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 text-primary" />
                  Install App
                </button>
              )}
            </div>
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
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">
                    Freshly Prepared
                  </p>
                  <p className="text-white/60 text-[11px] md:text-xs">
                    Hygienic & Clean
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">
                    Authentic Taste
                  </p>
                  <p className="text-white/60 text-[11px] md:text-xs">
                    100% Traditional
                  </p>
                </div>
              </div>

              {/* Desktop Center Divider */}
              <div className="hidden md:block w-[1px] h-12 bg-[#333333] mx-4"></div>

              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <Truck className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">
                    Fast Delivery
                  </p>
                  <p className="text-white/60 text-[11px] md:text-xs">
                    Hot to Your Door
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 md:px-4">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <div>
                  <p className="text-white text-[13px] md:text-sm font-bold leading-tight">
                    Dine-in & Pick-up
                  </p>
                  <p className="text-white/60 text-[11px] md:text-xs">
                    Sisuwa, Pokhara-30
                  </p>
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
          <section
            id="shop"
            className="pt-6 pb-12 md:pt-16 md:pb-20 w-full max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8"
          >
            {/* Mobile Header */}
            <div className="flex md:hidden justify-between items-center px-4 mb-4 mt-4">
              <h2 className="text-lg font-black text-black uppercase tracking-wider">
                Top Menu Picks
              </h2>
              <Link
                to="/shop"
                className="text-[13px] text-stone-600 hover:text-primary font-semibold"
              >
                View all
              </Link>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex flex-col items-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                Local Favorites
              </span>
              <h2 className="text-4xl font-black text-[#111111] uppercase tracking-tight">
                Popular Dishes in Pokhara
              </h2>
              <p className="text-stone-500 text-sm mt-2 font-medium">
                Freshly prepared with authentic Nepali spices and ingredients
              </p>
              <svg
                width="60"
                height="12"
                viewBox="0 0 40 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mt-4"
              >
                <path
                  d="M0 6C3 6 5 2 10 2C15 2 15 10 20 10C25 10 25 2 30 2C35 2 37 6 40 6"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
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
                  <div key={product.id} className="w-full">
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
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* View All Button */}
            <div className="flex justify-center mt-10 md:mt-12">
              <Link
                to="/shop"
                className="bg-orange-600 hover:bg-orange-500 text-white font-black text-[13px] uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-600/25"
              >
                VIEW FULL MENU
              </Link>
            </div>
          </section>
        </ScrollAnimation>

        {/* 4. ABOUT GOLE KHAJA GHAR - LOCAL SEO HIGHLIGHT */}
        <ScrollAnimation delay={0.15}>
          <section className="bg-stone-50 border-y border-stone-200 py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
                    About Gole Khaja Ghar (गोल खाजा घर)
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-stone-900 leading-tight mb-4">
                    The Premier Destination for Authentic Nepali Khaja in Sisuwa, Pokhara
                  </h2>
                  <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-4">
                    Nestled in <strong>Sisuwa, Pokhara-30</strong>, Gole Khaja Ghar brings you the quintessential taste of authentic Nepalese culinary tradition. Whether you are craving crispy beaten rice with spiced bhatmas in our signature <em>Nepali Khaja Set</em>, steaming hot momos, sizzling chowmein, or spiced sekuwa, every item is crafted with passion and traditional Himalayan spices.
                  </p>
                  <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-6">
                    We take pride in hygienic food preparation, made-to-order freshness, and warm Nepalese hospitality. Visit us with family and friends for a memorable dine-in experience, or order online for prompt delivery right across Lekhnath and Pokhara.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                      <div className="p-2 bg-orange-100 text-primary rounded-lg shrink-0 mt-0.5">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">Traditional Taste</h3>
                        <p className="text-stone-500 text-xs mt-0.5">Time-honored recipes & local spices</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                      <div className="p-2 bg-green-100 text-green-700 rounded-lg shrink-0 mt-0.5">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">100% Hygienic</h3>
                        <p className="text-stone-500 text-xs mt-0.5">Clean kitchen & fresh ingredients</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">Made Fresh</h3>
                        <p className="text-stone-500 text-xs mt-0.5">Cooked hot upon your order</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-md">
                  <h3 className="text-lg font-black text-stone-900 mb-4 uppercase tracking-wide">
                    Visit Our Restaurant
                  </h3>
                  <div className="space-y-4 text-stone-600 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-stone-900 block">Address:</strong>
                        <span>Sisuwa, Pokhara-30, Kaski, Gandaki Province, Nepal</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-stone-900 block">Opening Hours:</strong>
                        <span>8:00 AM – 9:00 PM (Daily)</span>
                        <span className="block text-xs text-amber-700 font-semibold mt-0.5">Closed 1st Tuesday of every month</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-stone-900 block">Order by Phone:</strong>
                        <a href="tel:+9779804146136" className="text-primary hover:underline font-bold mr-3">+977 9804146136</a>
                        <a href="tel:+9779846011810" className="text-primary hover:underline font-bold">+977 984-6011810</a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">Ready to feast?</span>
                    <Link
                      to="/shop"
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-600/20"
                    >
                      Order Online
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollAnimation>

        {/* 5. FREQUENTLY ASKED QUESTIONS (FAQ) - GOOGLE RICH SNIPPET SECTION */}
        <ScrollAnimation delay={0.2}>
          <section className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2 inline-block">
                Questions & Answers
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-stone-900 uppercase tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-stone-500 text-sm mt-2">
                Everything you need to know about Gole Khaja Ghar in Pokhara
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-stone-900 hover:text-primary transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm md:text-base">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-stone-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-stone-600 text-sm leading-relaxed border-t border-stone-100 bg-stone-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollAnimation>

        {/* 6. INSTALL APP SECTION */}
        <div id="install-app">
          <InstallAppSection />
        </div>

        {/* 7. PROCESS BANNER */}
        <ScrollAnimation delay={0.2} className="mt-auto">
          <section className="bg-orange-600 w-full py-10 md:py-12 border-t-[8px] md:border-t-[10px] border-orange-500 rounded-t-[2.5rem] md:rounded-t-[3rem] -mt-[2rem] md:-mt-[3rem] relative z-20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-10 md:gap-0">
              <div className="w-full md:w-[35%] text-center md:text-left flex flex-col items-center md:items-start">
                <h2 className="text-[28px] md:text-[2.2rem] lg:text-4xl font-black text-white uppercase leading-[1.1] tracking-tight">
                  Order Your Favorite
                  <br className="hidden md:block" />
                  Khaja Easily
                </h2>
                <svg
                  width="40"
                  height="12"
                  viewBox="0 0 40 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mt-3 md:mt-4"
                >
                  <path
                    d="M0 6C3 6 5 2 10 2C15 2 15 10 20 10C25 10 25 2 30 2C35 2 37 6 40 6"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between w-full md:flex-grow md:pl-8 lg:pl-12 gap-y-8 gap-x-2 md:gap-2">
                {[
                  {
                    title: "Browse Menu",
                    icon: (
                      <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    ),
                  },
                  {
                    title: "Select Portion",
                    icon: (
                      <Scale className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    ),
                  },
                  {
                    title: "Add to Cart",
                    icon: (
                      <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    ),
                  },
                  {
                    title: "Place Order",
                    icon: (
                      <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    ),
                  },
                  {
                    title: "Fresh Delivery",
                    icon: (
                      <Bike className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    ),
                  },
                ].map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-center text-center gap-3 w-[30%] md:w-auto md:min-w-0 flex-shrink-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                        {step.icon}
                      </div>
                      <span className="font-bold text-white text-[11px] md:text-xs lg:text-sm leading-tight drop-shadow-sm">
                        {step.title}
                      </span>
                    </div>
                    {index < 4 && (
                      <ArrowRight className="hidden md:block w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white/80 mb-8 flex-shrink-0" />
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
