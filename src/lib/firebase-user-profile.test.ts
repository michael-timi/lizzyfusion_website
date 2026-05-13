import { describe, expect, it } from "vitest";
import { splitDisplayName } from "./firebase-user-profile";

describe("splitDisplayName", () => {
  it("splits first token as first name and rest as last", () => {
    expect(splitDisplayName("Amina Oke")).toEqual({ firstName: "Amina", lastName: "Oke" });
    expect(splitDisplayName("Mary Jane Watson")).toEqual({ firstName: "Mary", lastName: "Jane Watson" });
  });

  it("handles empty and single-word names", () => {
    expect(splitDisplayName(null)).toEqual({ firstName: null, lastName: null });
    expect(splitDisplayName("   ")).toEqual({ firstName: null, lastName: null });
    expect(splitDisplayName("Lizzy")).toEqual({ firstName: "Lizzy", lastName: null });
  });
});
