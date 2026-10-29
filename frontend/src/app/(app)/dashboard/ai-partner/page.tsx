export const dynamic = "force-dynamic";

import AIPartnerRouteGate from "./AIPartnerRouteGate";

// No page header — the chat UI carries its own chrome, so the screen stays
// uncluttered and the conversation gets the full height. The gate below decides
// whether the chat mounts at all (englishconnection-ai-partner flag).
// (The old ?lang= parameter is gone: K.AI picks the language itself, D-059.)
export default function AIPartnerChatPage() {
  return <AIPartnerRouteGate />;
}
