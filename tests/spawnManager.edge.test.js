// @ts-check
import { describe, it, expect } from "vitest";
import { SpawnManager } from "../js/managers/SpawnManager.js";

function makeGame(rng) {
  return {
    rng,
    view: { width: 300, height: 300 },
    asteroidSpeed: 100,
    starSpeed: 50,
    asteroidPool: null,
    starPool: null,
    asteroids: [],
    stars: [],
  };
}

describe("SpawnManager counters", () => {
  it("creates indestructible asteroid every 11th asteroid", () => {
    const rng = { nextFloat: () => 0.0, range: (a, _b) => a };
    const g = makeGame(rng);

    // Create 12 asteroids via direct createAsteroid (bypass spawn probability)
    const results = [];
    for (let i = 0; i < 12; i++) {
      results.push(SpawnManager.createAsteroid(g));
    }

    const indestructible = results.filter((a) => a.isIndestructible);
    // Expect at least one indestructible in 12 spawns (every 11th)
    expect(indestructible.length).toBeGreaterThanOrEqual(1);
  });

  it("creates a red star after 10 yellow stars", () => {
    const rng = { nextFloat: () => 0.0, range: (a, _b) => a };
    const g = makeGame(rng);

    const results = [];
    for (let i = 0; i < 12; i++) results.push(SpawnManager.createStar(g));

    const red = results.filter((s) => s.isRed);
    expect(red.length).toBeGreaterThanOrEqual(1);
  });
});
