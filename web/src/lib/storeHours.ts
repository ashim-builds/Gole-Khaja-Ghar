import { useState, useEffect } from "react";

export interface StoreStatus {
  isOpen: boolean;
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
 * Evaluates whether Gole Khaja Ghar is currently open.
 * Rules:
 * 1. Open daily from 8:00 AM to 9:00 PM (08:00 to 21:00).
 * 2. Closed on the 1st Tuesday of every month (all day).
 */
export function getStoreStatus(): StoreStatus {
  const nepalDate = getNepalDate();
  const dayOfWeek = nepalDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
  const dayOfMonth = nepalDate.getDate();
  const hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();

  const currentTimeInMinutes = hours * 60 + minutes;
  const openTimeInMinutes = 8 * 60; // 08:00 AM (480 mins)
  const closeTimeInMinutes = 21 * 60; // 09:00 PM (1260 mins)

  // 1st Tuesday of month check: Tuesday (2) and date between 1 and 7
  const isFirstTuesday = dayOfWeek === 2 && dayOfMonth <= 7;

  // Operating hours check (8:00 AM to 9:00 PM)
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
 * React hook to subscribe to live store hours status with auto-update every 30 seconds
 */
export function useStoreHours(): StoreStatus {
  const [status, setStatus] = useState<StoreStatus>(getStoreStatus);

  useEffect(() => {
    // Initial check
    setStatus(getStoreStatus());

    // Auto-update periodically
    const interval = setInterval(() => {
      setStatus(getStoreStatus());
    }, 30000);

    // Re-check on tab focus / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setStatus(getStoreStatus());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return status;
}
