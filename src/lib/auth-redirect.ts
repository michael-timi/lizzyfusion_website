/** Prevent open redirects: only allow same-site relative paths. */
export function sanitizeNextParam(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
