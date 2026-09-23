import React from "react";
import { Link } from "react-router-dom";
import {
  Utensils,
  MapPin,
  Clock,
  Phone,
  Sparkles,
  ShieldCheck,
  Flame,
  Award,
  ArrowRight,
  Heart,
} from "lucide-react";
import ScrollAnimation from "@/components/ScrollAnimation";
import SEO from "@/components/SEO";

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Gole Khaja Ghar | Sisuwa",
  url: "https://golekhajaghar.com/about",
  description:
    "About Gole Khaja Ghar, an authentic Nepali restaurant and khaja eatery in Sisuwa, Pokhara-30, serving fresh momos, khaja sets, chowmein, and traditional snacks.",
  mainEntity: {
    "@type": "Restaurant",
    name: "Gole Khaja Ghar",
    alternateName: [
      "Gole Khaja",
      "Gole Ghar",
      "गोल खाजा घर",
      "Gole Khaja Ghar Sisuwa",
      "Gole Khaja Sisuwa",
      "Gole Ghar Sisuwa",
      "Gole Khaja Ghar Restaurant",
    ],
    url: "https://golekhajaghar.com",
    telephone: ["+977-9804146136", "+977-9846011810"],
    servesCuisine: ["Nepali", "Newari", "Khaja", "Fast Food"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sisuwa",
      addressLocality: "Pokhara-30",
      addressRegion: "Gandaki Province",
      postalCode: "33700",
      addressCountry: "NP",
    },
  },
};

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      <SEO
        title="About Gole Khaja Ghar | Sisuwa"
        description="Learn about Gole Khaja Ghar, the authentic Nepali restaurant and khaja eatery in Sisuwa, Pokhara-30. Fresh momos, traditional khaja sets, chowmein & sekuwa."
        canonical="https://golekhajaghar.com/about"
        keywords="About Gole Khaja Ghar, Gole Khaja, Gole Ghar, Gole Khaja Ghar Sisuwa, Restaurant in Sisuwa, Khaja Ghar in Sisuwa, Sisuwa food"
        schema={aboutSchema}
      />

      {/* Hero Section */}
      <section className="relative bg-[#111111] text-white py-16 sm:py-24 border-b border-stone-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-amber-600/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Our Story & Heritage • Sisuwa, Pokhara-30
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white">
            About <span className="text-primary">Gole Khaja Ghar</span>
          </h1>
          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Authentic Nepali flavors, warm local hospitality, and fresh daily
            preparation in the heart of Sisuwa, Pokhara-30.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <ScrollAnimation>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border border-stone-100 shadow-sm">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Locally Rooted
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Authentic Taste in Sisuwa, Pokhara
              </h2>
              <p className="text-stone-600 leading-relaxed text-sm sm:text-base">
                Welcome to <strong>Gole Khaja Ghar</strong>. Located in Sisuwa,
                Pokhara-30 (Lekhnath area, Kaski), our restaurant was founded
                with a simple and passionate commitment: to serve clean,
                authentic, and hearty Nepali food cooked with fresh local
                ingredients and time-honored recipes.
              </p>
              <p className="text-stone-600 leading-relaxed text-sm sm:text-base">
                Whether you are a neighbor stopping by for morning chana and
                tea, a worker enjoying a midday Khaja set, or a family gathering
                for hot evening momos, our kitchen prepares every dish fresh to
                order with genuine Himalayan hospitality.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-stone-100 aspect-[4/3] w-full">
              <img
                src="/images/golekhajaabout.jpeg"
                alt="Dining atmosphere and fresh Nepali food at Gole Khaja Ghar in Sisuwa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <p className="text-white text-sm font-bold">
                  Sisuwa, Pokhara-30 • Dine-In & Fast Delivery
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Natural Clarification of Name Variations & Local Culture */}
        <ScrollAnimation>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 sm:p-10 rounded-3xl border border-amber-200/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Known as Gole Khaja & Gole Ghar in Sisuwa
              </h2>
            </div>
            <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
              While our official name is <strong>Gole Khaja Ghar</strong>, our
              regular patrons and locals in Sisuwa and Lekhnath frequently refer
              to us colloquially as <strong>Gole Khaja</strong> (गोले खाजा) or{" "}
              <strong>Gole Ghar</strong> (गोले घर). In everyday local Nepali
              conversation, travelers and neighbors also casually ask for{" "}
              <em>"Gole Hotel"</em> or search for a trusted{" "}
              <em>"होटल तथा खाजा घर" in Sisuwa</em>.
            </p>
            <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
              We warmly welcome customers under all these affectionate names! We
              focus purely on exceptional culinary service—serving fresh meals,
              traditional khaja sets, takeaway parcels, and fast home delivery
              to homes and businesses across Pokhara-30.
            </p>
          </div>
        </ScrollAnimation>

        {/* Culinary Specialties */}
        <ScrollAnimation>
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Fresh From Our Kitchen
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
                What We Serve Daily
              </h2>
              <p className="text-stone-500 text-sm mt-2">
                Every item on our menu is cooked fresh to order with traditional
                spices and hygienic preparation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-2.5 hover:border-orange-200 transition-colors">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-stone-900">
                  Signature Khaja Sets
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  Crispy beaten rice (chura), spiced roasted soybean (bhatmas),
                  house-made spicy tomato and sesame achar, and savory curry.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-2.5 hover:border-orange-200 transition-colors">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-stone-900">
                  Fresh Momos
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  Juicy Buff and Chicken momos prepared daily—available steamed,
                  crispy pan-fried (kothey), or served in savory aromatic jhol.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-2.5 hover:border-orange-200 transition-colors">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-stone-900">
                  Chowmein & Sekuwa
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  Wok-tossed noodles with crunchy vegetables, flavorful fried
                  rice, marinated barbecued sekuwa, and crispy afternoon snacks.
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Location & Hospitality Overview */}
        <ScrollAnimation>
          <div className="bg-stone-900 text-white p-8 sm:p-10 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Visit Gole Khaja Ghar in Sisuwa
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  Conveniently situated in Pokhara-30, welcoming locals and
                  travelers daily.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/contact"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>View Location</span>
                </Link>
                <Link
                  to="/shop"
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  <span>Explore Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Address</p>
                  <p className="text-stone-400">
                    Sisuwa, Pokhara-30, Kaski, Nepal
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Opening Hours</p>
                  <p className="text-stone-400">8:00 AM – 9:00 PM Daily</p>
                  <p className="text-[11px] text-orange-400 mt-0.5">
                    (Closed 1st Tuesday of every month)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Call / WhatsApp</p>
                  <p className="text-stone-400 font-mono">+977 9804146136</p>
                  <p className="text-stone-400 font-mono">+977 9846011810</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </section>
    </div>
  );
}
