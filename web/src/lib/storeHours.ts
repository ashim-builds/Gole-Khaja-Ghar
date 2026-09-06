import { useState, useEffect } from "react";
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

/**
 * React hook to subscribe to live store hours status with server sync and local fallback
 */
export function useStoreHours(): StoreStatus {
  const [status, setStatus] = useState<StoreStatus>(getLocalStoreStatus);

  useEffect(() => {
    let mounted = true;

    async function syncServerStatus() {
      try {
        const res = await api.store.getStatus();
        if (mounted && res && res.success) {
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
        // Fallback to local evaluation silently
      }

      if (mounted) {
        setStatus(getLocalStoreStatus());
      }
    }

    syncServerStatus();

    // Auto-poll every 20 seconds to catch live admin open/close changes
    const interval = setInterval(syncServerStatus, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncServerStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return status;
}
