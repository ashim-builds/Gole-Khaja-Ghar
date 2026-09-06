import { api } from "./api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function checkPushSubscription(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { supported: false, permission: "denied", isSubscribed: false };
  }

  const permission = Notification.permission;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      return { supported: true, permission, isSubscribed: false };
    }
    const sub = await reg.pushManager.getSubscription();
    return { supported: true, permission, isSubscribed: !!sub };
  } catch (err) {
    console.error("[pushManager] checkPushSubscription error:", err);
    return { supported: true, permission, isSubscribed: false };
  }
}

export async function subscribeToPush(type: "customer" | "admin" = "customer"): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  let publicKey = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    try {
      const res = await api.push.getVapidPublicKey();
      if (res?.publicKey) publicKey = res.publicKey;
    } catch {}
  }
  if (!publicKey) {
    throw new Error("VAPID public key is not configured on the server.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Browser notification permission was denied.");
  }

  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register("/sw.js");
  }
  const activeReg = await navigator.serviceWorker.ready;

  let sub = await activeReg.pushManager.getSubscription();
  if (!sub) {
    sub = await activeReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const subJson = sub.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await api.push.subscribe(subJson, type);
  if (!res || !res.success) {
    throw new Error("Failed to register push subscription with server.");
  }

  return true;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.push.unsubscribe(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error("[pushManager] unsubscribeFromPush error:", err);
    throw err;
  }
}
