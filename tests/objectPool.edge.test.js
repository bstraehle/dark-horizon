// @ts-check
import { describe, it, expect } from "vitest";
import { ObjectPool } from "../js/utils/ObjectPool.js";

describe("ObjectPool edge cases", () => {
  it("disposes overflow objects when maxSize exceeded and disposer provided", () => {
    const disposed = [];
    const pool = new ObjectPool((v) => ({ id: v }), undefined, {
      maxSize: 1,
      dispose: (o) => disposed.push(o.id),
    });

    const a = pool.acquire(1);
    const b = pool.acquire(2);
    // pool has created two objects
    pool.release(a);
    pool.release(b); // this should invoke dispose since maxSize=1

    expect(disposed.length).toBeGreaterThanOrEqual(1);
    expect(disposed).toContain(2);
  });
});
