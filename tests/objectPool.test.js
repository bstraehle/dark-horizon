// @ts-check
import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../js/utils/ObjectPool.js';

describe('ObjectPool', () => {
  it('reuses released objects', () => {
    let created = 0;
    const pool = new ObjectPool(() => ({ v: 0, id: ++created }), (obj, v) => { obj.v = v; });

  const a = pool.acquire(1);
  const _b = pool.acquire(2);
    expect(created).toBe(2);

    pool.release(a);
    const c = pool.acquire(3);

    // c should be a reused object (either a or b); since we released a once, c should === a
    expect(c).toBe(a);
    expect(created).toBe(2);
    expect(c.v).toBe(3);
  });
});
