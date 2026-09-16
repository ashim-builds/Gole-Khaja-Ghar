import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  MessageCircle,
  Utensils,
  Truck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import ScrollAnimation from "@/components/ScrollAnimation";
import SEO from "@/components/SEO";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Gole Khaja Ghar Sisuwa",
  "url": "https://golekhajaghar.com/contact",
  "description":
    "Contact and location details for Gole Khaja Ghar in Sisuwa, Pokhara-30. Phone numbers, operating hours, delivery coverage, and map directions.",
  "mainEntity": {
    "@type": "Restaurant",
    "name": "Gole Khaja Ghar",
    "alternateName": [
      "Gole Khaja",
      "Gole Ghar",
      "गोल खाजा घर",
      "Gole Khaja Ghar Sisuwa",
      "Gole Khaja Sisuwa",
      "Gole Ghar Sisuwa",
      "Gole Khaja Ghar Restaurant"
    ],
    "telephone": ["+977-9804146136", "+977-9846011810"],
    "url": "https://golekhajaghar.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sisuwa",
      "addressLocality": "Pokhara-30",
      "addressRegion": "Gandaki Province",
      "postalCode": "33700",
      "addressCountry": "NP"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.1630,
      "longitude": 84.0730
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "08:00",
        "closes": "21:00"
      }
    ]
  }
};

export default function ContactPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Exact coordinates for Gole Khaja Ghar in Sisuwa, Pokhara-30
  const LAT = 28.163;
  const LNG = 84.073;

  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (!isMounted || !mapContainerRef.current) return;
        if (mapInstanceRef.current || (mapContainerRef.current as any)?._leaflet_id) {
          return;
        }

        const map = L.map(mapContainerRef.current, {
          center: [LAT, LNG],
          zoom: 16,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Custom pulsing orange marker icon
        const customIcon = L.divIcon({
          className: "custom-map-pin",
          html: `
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 36px; height: 36px; background: rgba(234, 88, 12, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 28px; height: 28px; background: #ea580c; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">
                ★
              </div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([LAT, LNG], { icon: customIcon }).addTo(map);
        marker
          .bindPopup(
            `
            <div style="font-family: sans-serif; padding: 4px; text-align: center;">
              <strong style="font-size: 14px; color: #111;">Gole Khaja Ghar</strong><br />
              <span style="font-size: 12px; color: #666;">Sisuwa, Pokhara-30, Kaski</span><br />
              <span style="font-size: 11px; color: #ea580c; font-weight: bold;">Open 8:00 AM – 9:00 PM</span>
            </div>
          `
          )
          .openPopup();

        setMapLoaded(true);
      } catch (err) {
        console.error("Leaflet map initialization error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <SEO
        title="Gole Khaja Ghar Sisuwa | Location & Contact"
        description="Visit or contact Gole Khaja Ghar in Sisuwa, Pokhara-30. Direct phone numbers (+977 9804146136, 9846011810), interactive map directions, hours and local delivery info."
        canonical="https://golekhajaghar.com/contact"
        keywords="Gole Khaja Ghar Sisuwa, Gole Khaja Sisuwa, Restaurant in Sisuwa, Khaja Ghar in Sisuwa, Restaurant near Sisuwa, Gole Khaja contact, Gole Ghar Sisuwa"
        schema={contactSchema}
      />

      {/* Header */}
      <section className="relative bg-[#111111] text-white py-16 sm:py-20 border-b border-stone-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-amber-600/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-3">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            Pokhara-30, Kaski • Gandaki Province
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-white">
            Gole Khaja Ghar in Sisuwa
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Find our restaurant location, get driving directions, view opening
            hours, or call us directly for takeaway and fast local delivery.
          </p>
        </div>
      </section>

      {/* Content Container */}
      <section className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Business Info</span>
              </h2>

              {/* Address */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Location Address</h3>
                  <p className="text-stone-600 text-sm mt-0.5 leading-relaxed">
                    Sisuwa, Pokhara-30,<br />
                    Kaski, Gandaki Province,<br />
                    Postal Code: 33700, Nepal
                  </p>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-stone-900 text-sm">Direct Phone Orders</h3>
                  <div className="mt-1 space-y-1">
                    <a
                      href="tel:+9779804146136"
                      className="flex items-center justify-between text-stone-800 font-bold text-sm hover:text-primary transition-colors py-1 px-2.5 bg-stone-50 hover:bg-orange-50 rounded-lg border border-stone-100"
                    >
                      <span>+977 9804146136</span>
                      <span className="text-[11px] text-primary font-semibold">Call</span>
                    </a>
                    <a
                      href="tel:+9779846011810"
                      className="flex items-center justify-between text-stone-800 font-bold text-sm hover:text-primary transition-colors py-1 px-2.5 bg-stone-50 hover:bg-orange-50 rounded-lg border border-stone-100"
                    >
                      <span>+977 984-6011810</span>
                      <span className="text-[11px] text-primary font-semibold">Call</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">WhatsApp Chat</h3>
                  <p className="text-xs text-stone-500 mb-1.5">
                    Message us for takeaway orders & inquiries
                  </p>
                  <a
                    href="https://wa.me/9779846011810"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-sm"
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3.5 border-t border-stone-100 pt-4">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Opening Hours</h3>
                  <p className="text-stone-800 font-bold text-sm mt-0.5">
                    8:00 AM – 9:00 PM Daily
                  </p>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md font-semibold mt-1">
                    Closed 1st Tuesday of every month
                  </p>
                </div>
              </div>
            </div>

            {/* Local Delivery Coverage Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-3xl border border-orange-200/80 space-y-3">
              <div className="flex items-center gap-2 text-orange-700 font-bold text-sm">
                <Truck className="w-4 h-4" />
                <span>Delivery Across Pokhara-30</span>
              </div>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                We deliver hot, freshly packed food across Sisuwa, Lekhnath, and
                surrounding Pokhara-30 neighborhoods.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 underline"
              >
                <span>Browse Menu & Order Online</span>
                <Navigation className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Interactive Map & Directions Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-stone-900">
                    Location Map & Directions
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Coordinates: 28.1630° N, 84.0730° E (Sisuwa, Pokhara-30)
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-md transition-transform active:scale-95"
                >
                  <Navigation className="w-4 h-4 text-orange-400" />
                  <span>Get Directions on Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </a>
              </div>

              {/* Map Canvas */}
              <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full z-0" />
                {!mapLoaded && (
                  <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-stone-400">Loading Sisuwa Map...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>📍 Centered at Gole Khaja Ghar, Sisuwa</span>
                <span className="font-semibold text-orange-600">Dine-in • Takeaway • Delivery</span>
              </div>
            </div>

            {/* Local Information FAQ block */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-black text-stone-900">
                Finding Gole Khaja Ghar in Sisuwa
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Whether you know us as <strong>Gole Khaja Ghar</strong>,{" "}
                <strong>Gole Khaja</strong>, or <strong>Gole Ghar</strong>, our
                eatery is situated centrally in Sisuwa, Pokhara-30. If you are
                visiting Sisuwa or searching for a trusted restaurant or khaja
                ghar near Sisuwa, you can easily reach us via the main road or
                call our direct lines for quick directions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
