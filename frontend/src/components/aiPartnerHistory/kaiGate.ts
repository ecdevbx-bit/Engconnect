import { createContext, useContext } from "react";

// Every link on this screen that opens K.AI (back link, "Start a conversation",
// "Continue this conversation") must respect the AI Partner flag the same way
// the nav does. The screen calls useAIPartnerGate() once and shares its `guard`
// here, so the list/detail/memory pieces don't each re-check access.

type Guard = (e?: { preventDefault: () => void; stopPropagation: () => void }) => boolean;

export const KaiGateContext = createContext<Guard>(() => false);

export function useKaiGuard(): Guard {
  return useContext(KaiGateContext);
}
