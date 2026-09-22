// Single-active-session id. The backend issues it at login and it rides on the
// NextAuth session (session.user.sessionId). We mirror it into this module
// variable so the API and WebSocket clients can stamp the X-Session-Id header
// / auth frame WITHOUT threading it through every call site. SessionIdSync (in
// providers) keeps it in sync with the session; client-only.
let currentSessionId = "";

export function setSessionId(sid: string | undefined | null): void {
  currentSessionId = sid ?? "";
}

export function getSessionId(): string {
  return currentSessionId;
}
