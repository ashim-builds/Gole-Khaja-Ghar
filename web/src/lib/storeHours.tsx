import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api from "@/lib/api";

export type StoreOperationalMode = "AUTO" | "MANUAL_OPEN" | "MANUAL_CLOSED";

export interface StoreStatus {
  isOpen: boolean;
  mode?: StoreOperationalMode;
  isFirstTuesday: boolean;
  isOutsideHours: boolean;
  statusText: string;
  badgeLabel: string;
  reason: string;
  nextOpening: string;
  nepalTimeFormatted: string;
}

/**
 * Calculates current time in Nepal Timezone (Asia/Kathmandu, UTC +5:45)
 */
export function getNepalDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepalOffsetMs = 5.75 * 3600000; // 5 hours 45 mins
  return new Date(utc + nepalOffsetMs);
}

/**
 * Local fallback calculation (Follows standard 8 AM - 9 PM, 1st Tuesday closed rule)
 */
export function getLocalStoreStatus(): StoreStatus {
  const nepalDate = getNepalDate();
  const dayOfWeek = nepalDate.getDay(); // 0 = Sunday, 2 = Tuesday
  const dayOfMonth = nepalDate.getDate();
  const hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();

  const currentTimeInMinutes = hours * 60 + minutes;
  const openTimeInMinutes = 8 * 60; // 08:00 AM
  const closeTimeInMinutes = 21 * 60; // 09:00 PM

  const isFirstTuesday = dayOfWeek === 2 && dayOfMonth <= 7;
  const isOutsideHours = currentTimeInMinutes < openTimeInMinutes || currentTimeInMinutes >= closeTimeInMinutes;

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const nepalTimeFormatted = timeFormatter.format(nepalDate);

  if (isFirstTuesday) {
    return {
      isOpen: false,
      mode: "AUTO",
      isFirstTuesday: true,
      isOutsideHours: false,
      statusText: "Closed Today",
      badgeLabel: "Closed Today (1st Tuesday)",
      reason: "Closed today for our scheduled monthly maintenance (1st Tuesday of every month).",
      nextOpening: "Tomorrow at 8:00 AM",
      nepalTimeFormatted,
    };
  }

  if (isOutsideHours) {
    const willOpenToday = currentTimeInMinutes < openTimeInMinutes;
    return {
      isOpen: false,
      mode: "AUTO",
      isFirstTuesday: false,
      isOutsideHours: true,
      statusText: "Currently Closed",
      badgeLabel: "Closed (Opens 8:00 AM)",
      reason: "Our store is currently closed. Online ordering is available from 8:00 AM to 9:00 PM.",
      nextOpening: willOpenToday ? "Today at 8:00 AM" : "Tomorrow at 8:00 AM",
      nepalTimeFormatted,
    };
  }

  return {
    isOpen: true,
    mode: "AUTO",
    isFirstTuesday: false,
    isOutsideHours: false,
    statusText: "Open Now",
    badgeLabel: "Open (8:00 AM – 9:00 PM)",
    reason: "We are currently open and accepting fresh dine-in, takeaway, and delivery orders!",
    nextOpening: "Open until 9:00 PM tonight",
    nepalTimeFormatted,
  };
}

const StoreHoursContext = createContext<StoreStatus | undefined>(undefined);

/**
 * Global Store Hours Provider:
 * Shares 1 single store status state across the entire app so dozens of
 * ProductCard and Drawer components don't each fire independent network requests.
 */
export function StoreHoursProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>(getLocalStoreStatus);

  const syncServerStatus = useCallback(async () => {
    // Avoid firing network requests when tab is hidden/minimized
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    try {
      const res = await api.store.getStatus();
      if (res && res.success) {
        setStatus({
          isOpen: res.isOpen,
          mode: res.mode || "AUTO",
          isFirstTuesday: res.isFirstTuesday,
          isOutsideHours: res.isOutsideHours,
          statusText: res.statusText,
          badgeLabel: res.badgeLabel,
          reason: res.reason,
          nextOpening: res.nextOpening,
          nepalTimeFormatted: res.nepalTimeFormatted,
        });
        return;
      }
    } catch {
      // Fallback silently to local evaluation
    }
  }, []);

  useEffect(() => {
    syncServerStatus();

    // Background sync every 60 seconds (instead of 20 seconds) only when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        syncServerStatus();
      }
    }, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncServerStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [syncServerStatus]);

  return (
    <StoreHoursContext.Provider value={status}>
      {children}
    </StoreHoursContext.Provider>
  );
}

/**
 * React hook to consume the shared store hours status
 */
export function useStoreHours(): StoreStatus {
  const context = useContext(StoreHoursContext);
  if (context !== undefined) {
    return context;
  }
  return getLocalStoreStatus();
}

export default useStoreHours;
