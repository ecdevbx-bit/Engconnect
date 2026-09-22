"use client";

import { useEffect } from "react";

// Registers the PWA service worker (public/sw.js) once on the client. Renders
// nothing — it's a side-effect-only component meant to sit in the root layout.
// Registration is best-effort: if it fails the app keeps working, just without
// offline support.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
