// Shown when a user tries to access a protected feature without being signed in

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotSignedInPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="c-box rounded-xl text-center max-w-md w-full flex flex-col gap-4 px-8 py-10">
        <div className="text-4xl">🔒</div>
        <h1 className="font-semibold text-2xl text-heading">
          Sign In Required
        </h1>
        <p className="text-muted-foreground text-sm">
          You need to sign in to access this feature and save your progress.
        </p>
        <div className="flex flex-col gap-3 mt-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
