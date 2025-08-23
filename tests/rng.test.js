// @ts-check
import { describe, it, expect } from "vitest";
import { RNG } from "../js/utils/RNG.js";

describe("RNG", () => {
  it("produces deterministic sequence for same seed", () => {
    const a = new RNG(1234);
    const b = new RNG(1234);
    const seqA = Array.from({ length: 10 }, () => a.nextFloat());
    const seqB = Array.from({ length: 10 }, () => b.nextFloat());
    expect(seqA).toEqual(seqB);
  });

  it("range(min,max) returns within bounds", () => {
    const r = new RNG(42);
    for (let i = 0; i < 100; i++) {
      const x = r.range(-5, 5);
      expect(x).toBeGreaterThanOrEqual(-5);
      expect(x).toBeLessThanOrEqual(5);
    }
  });

  it("nextInt(max) is in [0, max)", () => {
    const r = new RNG(7);
    for (let i = 0; i < 100; i++) {
      const n = r.nextInt(10);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);
    }
  });
});
