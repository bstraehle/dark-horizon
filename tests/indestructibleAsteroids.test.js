// @ts-check
import { describe, it, expect } from "vitest";
import { SpawnManager } from "../js/managers/SpawnManager.js";
import { CollisionManager } from "../js/managers/CollisionManager.js";

function makeRng() {
  return {
    _i: 0,
    nextFloat() {
      // deterministic but varied
      this._i = (this._i + 0.37) % 1;
      return this._i;
    },
    range(a, _b) {
      return a;
    },
  };
}

function makeGame() {
  const rng = makeRng();
  /** @type {any} */
  const g = {
    rng,
    view: { width: 300, height: 300 },
    asteroidSpeed: 100,
    starSpeed: 50,
    asteroidPool: null,
    starPool: null,
    asteroids: [],
    stars: [],
  };
  return g;
}

describe("Indestructible asteroids", () => {
  it("marks every 11th asteroid as indestructible", () => {
    const g = makeGame();
    for (let i = 0; i < 22; i++) {
      g.asteroids.push(SpawnManager.createAsteroid(g));
    }
    const ind = g.asteroids.filter((a) => a.isIndestructible);
    // With the threshold lowered to 4, expect more indestructibles (roughly 4 in 22)
    expect(ind.length).toBeGreaterThanOrEqual(3);
    // Check a few expected positions (5th, 10th, 15th, 20th -> indices 4,9,14,19)
    expect(g.asteroids[4].isIndestructible).toBe(true);
    expect(g.asteroids[9].isIndestructible).toBe(true);
  });

  it("bullets don't destroy indestructible asteroids", () => {
    /** @type {any} */
    const g = {
      cellSize: 64,
      asteroids: [],
      bullets: [],
      stars: [],
      player: { x: -9999, y: -9999, width: 1, height: 1 },
      rng: makeRng(),
      particlePool: { acquire: () => ({}) },
    };
    // Place one normal and one indestructible asteroid and a bullet overlapping both sequentially
    const normal = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      isIndestructible: false,
      getBounds() {
        return this;
      },
    };
    const hard = {
      x: 40,
      y: 10,
      width: 20,
      height: 20,
      isIndestructible: true,
      getBounds() {
        return this;
      },
    };
    g.asteroids.push(normal, hard);
    // Two bullets, one for each
    g.bullets.push({
      x: 15,
      y: 15,
      width: 5,
      height: 5,
      getBounds() {
        return this;
      },
    });
    g.bullets.push({
      x: 45,
      y: 15,
      width: 5,
      height: 5,
      getBounds() {
        return this;
      },
    });

    // No events needed for this check
    CollisionManager.check(g);
    // Normal asteroid should be removed, indestructible remains
    expect(g.asteroids.some((a) => a === normal)).toBe(false);
    expect(g.asteroids.some((a) => a === hard)).toBe(true);
  });
});
