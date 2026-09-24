"use client";

import { useLearnEnabled } from "@/lib/featureFlags";
import { useSession } from "@/lib/session";

// Show Learn links when the admin switch is ON, or to admins (preview while
// it's OFF). The /learn pages check the same thing on the server.
export function useLearnVisible(): boolean {
  const enabled = useLearnEnabled();
  const session = useSession();
  return enabled || session.data?.user?.isAdmin === true;
}
