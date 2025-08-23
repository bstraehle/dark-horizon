// @ts-check
import { describe, it, expect } from "vitest";
import { CollisionManager } from "../js/managers/CollisionManager.js";

function makeAst(x, y, w, h) {
  return { x, y, width: w, height: h };
}

function makeBullet(x, y, w, h) {
  return { x, y, width: w, height: h };
}

describe("CollisionManager grid happy path", () => {
  it("registers chunk neighbors and finds intersection for bullet vs asteroid", () => {
    const game = /** @type {any} */ ({
      cellSize: 50,
      asteroids: [makeAst(90, 90, 40, 40)],
      bullets: [makeBullet(100, 100, 4, 10)],
      score: 0,
      createExplosion: () => {},
      bulletPool: { release: () => {} },
      asteroidPool: { release: () => {} },
      stars: [],
      player: { x: 0, y: 0, width: 10, height: 10 },
      rng: { range: (a, _b) => a },
      particlePool: { acquire: () => ({}) },
      particles: [],
      starPool: { release: () => {} },
      updateScore: () => {},
      // constants used in bullet/asteroid removal loops
    });

    CollisionManager.check(game);

    expect(game.asteroids.length).toBe(0);
    expect(game.bullets.length).toBe(0);
  });
});
