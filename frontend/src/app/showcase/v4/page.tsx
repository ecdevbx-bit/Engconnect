import Landing from "@/components/Landing";

// Swapped: the v4 showcase design was promoted to the home route ("/"), and the
// previous main Landing now lives here at /showcase/v4. The v4 design itself
// lives in @/components/ShowcaseV4 and is rendered by app/page.tsx.
export default function Page() {
  return <Landing />;
}
