import { describe, expect, it } from "vitest";
import {
  catalogDateMatchesRange,
  endOfDayMs,
  isInvertedDateRange,
  startOfDayMs,
} from "./admin-catalog-date-filter";

const jun3 = new Date(2026, 5, 3, 12, 0, 0).getTime(); // midday Jun 3 2026, local

describe("catalogDateMatchesRange", () => {
  it("matches everything when no bounds are set", () => {
    expect(catalogDateMatchesRange(jun3, "", "")).toBe(true);
    expect(catalogDateMatchesRange(null, "", "")).toBe(true);
    expect(catalogDateMatchesRange(undefined, "", "")).toBe(true);
  });

  it("excludes missing dates whenever a bound is active", () => {
    expect(catalogDateMatchesRange(null, "2026-06-01", "")).toBe(false);
    expect(catalogDateMatchesRange(undefined, "", "2026-06-30")).toBe(false);
  });

  it("is inclusive on both ends down to the day boundary", () => {
    expect(catalogDateMatchesRange(jun3, "2026-06-03", "2026-06-03")).toBe(true);
    expect(catalogDateMatchesRange(startOfDayMs("2026-06-03")!, "2026-06-03", "2026-06-03")).toBe(true);
    expect(catalogDateMatchesRange(endOfDayMs("2026-06-03")!, "2026-06-03", "2026-06-03")).toBe(true);
  });

  it("respects an open-ended (from only / to only) range", () => {
    expect(catalogDateMatchesRange(jun3, "2026-06-01", "")).toBe(true);
    expect(catalogDateMatchesRange(jun3, "2026-06-04", "")).toBe(false);
    expect(catalogDateMatchesRange(jun3, "", "2026-06-30")).toBe(true);
    expect(catalogDateMatchesRange(jun3, "", "2026-06-02")).toBe(false);
  });

  it("matches nothing for an inverted (from > to) range", () => {
    expect(catalogDateMatchesRange(jun3, "2026-06-30", "2026-06-01")).toBe(false);
  });
});

describe("isInvertedDateRange", () => {
  it("flags from strictly after to", () => {
    expect(isInvertedDateRange("2026-06-30", "2026-06-01")).toBe(true);
  });

  it("is false for valid, equal, or partial ranges", () => {
    expect(isInvertedDateRange("2026-06-01", "2026-06-30")).toBe(false);
    expect(isInvertedDateRange("2026-06-03", "2026-06-03")).toBe(false);
    expect(isInvertedDateRange("", "2026-06-30")).toBe(false);
    expect(isInvertedDateRange("2026-06-01", "")).toBe(false);
  });
});
