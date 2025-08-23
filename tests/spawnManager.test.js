// @ts-check
import { describe, it, expect } from 'vitest';
import { SpawnManager } from '../js/managers/SpawnManager.js';
import { CONFIG } from '../js/constants.js';

function makeGame(rng) {
  return {
    rng,
    view: { width: 300, height: 300 },
    asteroidSpeed: 100,
    starSpeed: 50,
    asteroidPool: null,
    starPool: null,
  /** @type {any[]} */ asteroids: [],
  /** @type {any[]} */ stars: [],
  };
}

describe('SpawnManager', () => {
  it('spawn probability increases with dt', () => {
    // Deterministic RNG that returns 0.999 (rare spawn) then 0.0 (certain spawn)
    const seq = [0.999, 0.0];
  const rng = { nextFloat: () => (seq.length ? seq.shift() : 0.0), range: (a,_b)=>a };
    const g1 = makeGame(rng);

    SpawnManager.spawnObjects(g1, 0.001); // extremely small dt, likely no spawn on first call
    const a1 = g1.asteroids.length + g1.stars.length;

  const g2 = makeGame({ nextFloat: () => 0.0, range: (a,_b)=>a }); // always spawn if p>0
    SpawnManager.spawnObjects(g2, 1.0); // large dt ~ guaranteed spawn for both
    const a2 = g2.asteroids.length + g2.stars.length;

    expect(a2).toBeGreaterThanOrEqual(a1);
    expect(a2).toBeGreaterThan(0);
  });

  it('spawns within horizontal margins', () => {
  const rng = { nextFloat: () => 0.0, range: (a,_b)=>a }; // force spawn at left edge
    const g = makeGame(rng);
    SpawnManager.spawnObjects(g, 1);
    SpawnManager.spawnObjects(g, 1);

    for (const a of g.asteroids) {
      const minX = CONFIG.ASTEROID.HORIZONTAL_MARGIN / 2;
      expect(a.x).toBeGreaterThanOrEqual(minX);
      expect(a.x + a.width).toBeLessThanOrEqual(g.view.width - minX);
    }
    for (const s of g.stars) {
      const minX = CONFIG.STAR.HORIZONTAL_MARGIN / 2;
      expect(s.x).toBeGreaterThanOrEqual(minX);
      expect(s.x + s.width).toBeLessThanOrEqual(g.view.width - minX);
    }
  });
});
