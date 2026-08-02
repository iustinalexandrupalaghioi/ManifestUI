// Marks that the current session was established via a password-recovery
// code exchange (see auth/callback/route.ts, which sets this after
// `exchangeCodeForSession` reports `redirectType === "recovery"`).
// update-password.ts requires this marker before allowing a password
// change, so a hijacked ordinary session (stolen cookie, unlocked device,
// XSS elsewhere) can't silently take over the account just by visiting
// /auth/update-password — only a real click-through of the emailed
// recovery link can set it.
export const RECOVERY_COOKIE = "sb-recovery-flow";
export const RECOVERY_COOKIE_MAX_AGE_SECONDS = 60 * 10;
