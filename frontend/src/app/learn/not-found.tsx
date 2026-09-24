import Link from "next/link";

// Unknown track or lesson inside an open library (rendered within the Learn
// layout). When the library itself is closed, the layout 404s to the root page.
export default function LearnNotFound() {
  return (
    <div className="c-box mx-auto max-w-md rounded-2xl px-6 py-12 text-center">
      <p className="text-gradient text-5xl font-extrabold">404</p>
      <h1 className="mt-3 text-2xl font-bold text-heading">Lesson not found</h1>
      <p className="mt-2 text-body">It may have moved. Pick a lesson from the library.</p>
      <Link
        href="/learn"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-6 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        Back to Learn
      </Link>
    </div>
  );
}
