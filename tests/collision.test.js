// @ts-check
import { describe, it, expect } from "vitest";
import { CollisionManager } from "../js/managers/CollisionManager.js";

describe("CollisionManager.intersects", () => {
  it("detects overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(CollisionManager.intersects(a, b)).toBe(true);
  });

  it("detects non-overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 11, y: 0, width: 10, height: 10 };
    expect(CollisionManager.intersects(a, b)).toBe(false);
  });

  it("edge-touch does not count as overlap (AABB strict)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(CollisionManager.intersects(a, b)).toBe(false);
  });
});
