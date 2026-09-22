export const dynamic = "force-dynamic";

import AIPartnerRouteGate from "./AIPartnerRouteGate";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// No page header — the chat UI carries its own chrome, so the screen stays
// uncluttered and the conversation gets the full height. The gate below decides
// whether the chat mounts at all (englishconnection-ai-partner flag).
export default async function AIPartnerChatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const lang = typeof params.lang === "string" ? params.lang : undefined;

  return <AIPartnerRouteGate lang={lang} />;
}
