import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="c-box rounded-xl max-w-md w-full px-8 py-12 flex flex-col items-center gap-6 text-center">
        <div className="text-gradient text-6xl font-bold select-none">404</div>
        <h1 className="text-2xl font-semibold text-heading">Page not found</h1>
        <p className="text-body">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="bg-gradient-to-br from-[#b79fff] to-[#ab8eff] text-[#0b0e14] font-semibold px-6 py-2.5 rounded-full hover:opacity-90 shadow-[0_0_20px_rgba(171,142,255,0.35)] transition"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
