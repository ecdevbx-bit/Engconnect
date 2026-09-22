// Shared constants for the PWA install flow. Deliberately NOT a "use client"
// module: the root layout is a server component, and every export of a
// "use client" module reaches a server component as a client-reference proxy
// rather than its real value — which would turn INSTALL_CAPTURE_SCRIPT into an
// object instead of the script text. Keeping this plain lets both sides import
// the same literals.

/** Custom events the capture script re-broadcasts on. */
export const CAN_INSTALL_EVENT = "ec:can-install";
export const APP_INSTALLED_EVENT = "ec:app-installed";

/**
 * Inline script for the top of <body>. It has to execute during HTML parse —
 * before any bundle loads — because Chromium fires `beforeinstallprompt` before
 * React hydrates, and an event missed there is an install button that never
 * works. All it does is preventDefault() (suppressing the browser's own
 * mini-infobar), stash the event on `window`, and re-broadcast so usePwaInstall
 * can pick it up whenever it mounts.
 *
 * Must stay ES5-plain and must never contain the closing-script sequence.
 */
export const INSTALL_CAPTURE_SCRIPT = `(function(){try{
window.__ecInstallPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ecInstallPrompt=e;window.dispatchEvent(new Event('${CAN_INSTALL_EVENT}'));});
window.addEventListener('appinstalled',function(){window.__ecInstallPrompt=null;window.dispatchEvent(new Event('${APP_INSTALLED_EVENT}'));});
}catch(e){}})();`;
