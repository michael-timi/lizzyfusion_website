/**
 * Pure helpers for the admin catalogue "filter by date" control.
 *
 * Date inputs (`<input type="date">`) yield `YYYY-MM-DD` strings interpreted in the admin's local
 * timezone. The range is inclusive on both ends: `from` snaps to the start of that local day and
 * `to` snaps to the end of that local day, so a product edited at any time on the `to` date still
 * matches. An empty `from`/`to` means unbounded on that side.
 */

function parseYmd(ymd: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Local-time epoch ms for `00:00:00.000` on the given `YYYY-MM-DD`, or null if unparseable. */
export function startOfDayMs(ymd: string): number | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  return new Date(p.year, p.month - 1, p.day, 0, 0, 0, 0).getTime();
}

/** Local-time epoch ms for `23:59:59.999` on the given `YYYY-MM-DD`, or null if unparseable. */
export function endOfDayMs(ymd: string): number | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  return new Date(p.year, p.month - 1, p.day, 23, 59, 59, 999).getTime();
}

/**
 * Whether a timestamp (epoch ms) falls within an inclusive `[from, to]` date range.
 *
 * - Empty `from` and empty `to` → range is inactive, everything matches (returns `true`).
 * - A missing value (`null`/`undefined`) is **excluded** whenever the range is active, since it
 *   cannot be placed on the timeline.
 * - `from > to` is a contradictory range and naturally matches nothing.
 */
export function catalogDateMatchesRange(
  valueMs: number | null | undefined,
  fromYmd: string,
  toYmd: string,
): boolean {
  const hasFrom = fromYmd.trim() !== "";
  const hasTo = toYmd.trim() !== "";
  if (!hasFrom && !hasTo) return true;
  if (valueMs == null) return false;

  if (hasFrom) {
    const fromMs = startOfDayMs(fromYmd);
    if (fromMs !== null && valueMs < fromMs) return false;
  }
  if (hasTo) {
    const toMs = endOfDayMs(toYmd);
    if (toMs !== null && valueMs > toMs) return false;
  }
  return true;
}

/** `true` when both ends are set and `from` is strictly after `to` (an impossible range). */
export function isInvertedDateRange(fromYmd: string, toYmd: string): boolean {
  const fromMs = startOfDayMs(fromYmd);
  const toMs = startOfDayMs(toYmd);
  if (fromMs === null || toMs === null) return false;
  return fromMs > toMs;
}
