// One request shared by every caller that asks for the same thing at about the
// same time. A dashboard load mounts several components that each fetch e.g.
// /chat/access or /users/me/attributes; without this each one is its own
// Vercel function call (CPU is billed per call). Successful answers are reused
// for `ttlMs`; a failure is forgotten at once so the next caller retries.
const entries = new Map<string, { at: number; promise: Promise<unknown> }>();

export function sharedRequest<T>(key: string, ttlMs: number, run: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key);
  if (hit && now - hit.at < ttlMs) return hit.promise as Promise<T>;
  const promise = run().catch((err) => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
    throw err;
  });
  entries.set(key, { at: now, promise });
  return promise;
}

