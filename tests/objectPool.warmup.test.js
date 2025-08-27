// @ts-check
import { describe, it, expect } from "vitest";
import { ObjectPool } from "../js/utils/ObjectPool.js";

describe("ObjectPool warmUp and exhaustion", () => {
  it("warmUp preallocates objects and respects maxSize", () => {
    let created = 0;
    const pool = new ObjectPool(() => ({ id: ++created }), undefined, { maxSize: 3 });

    pool.warmUp(5);
    // maxSize=3 should limit freeCount to 3
    expect(pool.freeCount).toBeLessThanOrEqual(3);
    expect(pool.createdCount).toBeGreaterThanOrEqual(pool.freeCount);
  });

  it("acquire creates new objects when pool empty and release caches up to maxSize", () => {
    let created = 0;
    const pool = new ObjectPool(() => ({ id: ++created }), undefined, { maxSize: 2 });
    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();
    expect(created).toBe(3);
    pool.release(a);
    pool.release(b);
    pool.release(c);
    expect(pool.freeCount).toBeLessThanOrEqual(2);
  });
});
