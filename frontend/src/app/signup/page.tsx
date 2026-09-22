// /signup opens the same card as /login, in "create account" mode (Google or
// email + password). Kept as a route so the many existing "/signup" CTAs work.
import { Suspense } from "react";

import LoginForm from "../../components/auth/LoginForm";

export default function SignupPage() {
  return (
    <Suspense>
      <LoginForm mode="signup" />
    </Suspense>
  );
}
