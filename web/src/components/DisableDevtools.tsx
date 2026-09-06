"use client";

import { useEffect } from "react";

export default function DisableDevtools() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventDevTools = (e: KeyboardEvent) => {
      // 1. Disable F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // 2. Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // 3. Disable Cmd+Opt+I, Cmd+Opt+J, Cmd+Opt+C (Mac)
      if (e.metaKey && e.altKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // 4. Disable Ctrl+U (View Source) (Windows/Linux)
      if (e.ctrlKey && ["U", "u"].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // 5. Disable Cmd+U (View Source) (Mac)
      if (e.metaKey && ["U", "u"].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // 6. Disable Ctrl+S (Save Page) (Windows/Linux)
      if (e.ctrlKey && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // 7. Disable Cmd+S (Save Page) (Mac)
      if (e.metaKey && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventDevTools);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventDevTools);
    };
  }, []);

  return null;
}
