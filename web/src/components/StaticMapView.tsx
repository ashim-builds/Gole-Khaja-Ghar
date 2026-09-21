"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, ExternalLink, Loader2 } from "lucide-react";

interface StaticMapViewProps {
  address: string;
}

// Fallback Center: Sisuwa / Lekhnath / Pokhara
const DEFAULT_CUSTOMER_LAT = 28.1618205;
const DEFAULT_CUSTOMER_LNG = 84.0709908;

/**
 * Extracts GPS coordinates from formatted text like "[GPS: 28.1618, 84.0709]" or "28.1618, 84.0709"
 */
function parseCoordinatesFromAddress(
  addr: string,
): { lat: number; lng: number } | null {
  if (!addr) return null;

  // 1. Check for [GPS: lat, lng]
  const gpsMatch = addr.match(
    /\[GPS:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\]/i,
  );
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1]);
    const lng = parseFloat(gpsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 2. Check for standalone comma separated lat, lng
  const rawCoords = addr.match(
    /(-?\d{1,2}\.\d{3,8})\s*,\s*(-?\d{1,3}\.\d{3,8})/,
  );
  if (rawCoords) {
    const lat = parseFloat(rawCoords[1]);
    const lng = parseFloat(rawCoords[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

/**
 * Cleans the address text for human display by stripping [GPS: ...] tags
 */
export function cleanAddressText(addr?: string): string {
  if (!addr) return "No delivery address provided";
  return addr.replace(/\[GPS:[^\]]+\]/gi, "").trim();
}

/**
 * Robust geocoding chain: Photon API -> Nominatim with progressive token simplification
 */
async function geocodeAddress(
  rawAddress: string,
): Promise<{ lat: number; lng: number } | null> {
  const clean = cleanAddressText(rawAddress).replace(/[–—]/g, "-").trim();
  if (!clean || clean.length < 3) return null;

  // 1. Try Photon (Fast OpenStreetMap Search API)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=1`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // 2. Prepare candidate query strings for Nominatim
  const tokens = clean
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const queries: string[] = [clean];

  if (tokens.length >= 2) {
    const simple = `${tokens[0]}, Pokhara, Nepal`;
    if (!queries.includes(simple)) queries.push(simple);
  }

  if (tokens.length >= 3) {
    const locality = `${tokens[1]}, Pokhara, Nepal`;
    if (!queries.includes(locality)) queries.push(locality);
  }

  if (!clean.toLowerCase().includes("pokhara")) {
    queries.push(`${clean}, Pokhara, Nepal`);
  }

  // 3. Try queries against Nominatim
  for (const q of queries) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q,
      )}&limit=1`;
      const res = await fetch(nominatimUrl, {
        headers: {
          "Accept-Language": "en",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      }
    } catch {
      // Continue
    }
  }

  return null;
}

export default function StaticMapView({ address }: StaticMapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_CUSTOMER_LAT,
    lng: DEFAULT_CUSTOMER_LNG,
  });
  const [hasResolvedCoords, setHasResolvedCoords] = useState(false);

  const parsedCoords = parseCoordinatesFromAddress(address);
  const cleanAddr = cleanAddressText(address);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === "undefined" || !containerRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      let targetLat = parsedCoords ? parsedCoords.lat : null;
      let targetLng = parsedCoords ? parsedCoords.lng : null;

      // If no explicit GPS coords in address text, perform progressive geocoding
      if (targetLat === null || targetLng === null) {
        const geocoded = await geocodeAddress(address);
        if (geocoded) {
          targetLat = geocoded.lat;
          targetLng = geocoded.lng;
        }
      }

      if (!isMounted) return;

      const finalLat = targetLat !== null ? targetLat : DEFAULT_CUSTOMER_LAT;
      const finalLng = targetLng !== null ? targetLng : DEFAULT_CUSTOMER_LNG;
      const resolved = targetLat !== null && targetLng !== null;

      setCoords({ lat: finalLat, lng: finalLng });
      setHasResolvedCoords(resolved);

      // Clean up previous Leaflet instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if ((containerRef.current as any)?._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id;
      }

      const map = L.map(containerRef.current, {
        center: [finalLat, finalLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Customer Destination Marker (Clean Red Location Pin SVG)
      const customerIcon = L.divIcon({
        className: "custom-customer-pin",
        html: `
          <div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));transform:translateY(-2px);">
            <svg viewBox="0 0 24 24" width="32" height="40" fill="#dc2626" stroke="#ffffff" stroke-width="1.2" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });

      const customerMarker = L.marker([finalLat, finalLng], {
        icon: customerIcon,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family:sans-serif;font-size:12px;font-weight:700;color:#1c1917;padding:2px 0;">
          Customer Delivery Location
          <div style="font-size:11px;font-weight:400;color:#78716c;margin-top:2px;line-height:1.3;">
            ${cleanAddr || "Delivery Point"}
          </div>
        </div>
      `;
      customerMarker.bindPopup(popupHtml);

      setIsReady(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [address]);

  /**
   * Launch turn-by-turn Navigation in Google Maps with Auto-Tracking
   */
  const handleStartGoogleNavigation = () => {
    const destinationTarget = hasResolvedCoords
      ? `${coords.lat},${coords.lng}`
      : encodeURIComponent(cleanAddr || `${coords.lat},${coords.lng}`);

    const navUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destinationTarget}&travelmode=driving`;
    window.open(navUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full space-y-2.5 overflow-hidden">
      {/* Map View */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100 h-[220px] sm:h-[260px] w-full">
        <div ref={containerRef} className="w-full h-full z-0" />

        {!isReady && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            <span className="text-[11px] font-bold text-stone-500">
              Locating Delivery Address...
            </span>
          </div>
        )}
      </div>

      {/* Google Maps Navigation Button */}
      <button
        type="button"
        onClick={handleStartGoogleNavigation}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        <Navigation className="w-4 h-4 shrink-0" />
        <span>Open in Google Maps</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
      </button>
    </div>
  );
}
