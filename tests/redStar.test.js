// @ts-check
import { describe, it, expect } from "vitest";
import { SpawnManager } from "../js/managers/SpawnManager.js";
import { EventBus } from "../js/core/EventBus.js";
import { EventHandlers } from "../js/systems/EventHandlers.js";
import { CONFIG } from "../js/constants.js";

function makeGameForSpawn() {
  return {
    rng: { nextFloat: () => 0.5, range: (a, _b) => a },
    view: { width: 300, height: 300 },
    starSpeed: 50,
    starPool: null,
  };
}

describe("Red star cadence and scoring", () => {
  it("spawns a red star after 10 yellow stars", () => {
    const g = makeGameForSpawn();
    /** @type {any[]} */
    const stars = [];
    for (let i = 1; i <= 22; i++) {
      stars.push(SpawnManager.createStar(g));
    }
    // With STAR_YELLOW_BEFORE_RED reduced to 4, the 5th, 10th, 15th, 20th should be red
    expect(stars[4].isRed).toBe(true);
    expect(stars[9].isRed).toBe(true);
    expect(stars[14].isRed).toBe(true);
    expect(stars[19].isRed).toBe(true);
    // Earlier ones before first red should be yellow
    for (let i = 0; i < 4; i++) expect(!!stars[i].isRed).toBe(false);
  });

  it("awards 20 for yellow, 50 for red on collection", () => {
    const game = {
      score: 0,
      updateScore: () => {},
      events: new EventBus(),
      rng: { range: (a, _b) => a },
      particlePool: { acquire: () => ({}) },
      particles: [],
    };
    const unsub = EventHandlers.register(game);
    // Yellow collection
    game.events.emit("collectedStar", { star: { x: 0, y: 0, width: 10, height: 10 } });
    expect(game.score).toBe(CONFIG.GAME.STAR_SCORE);
    // Red collection
    game.events.emit("collectedStar", { star: { x: 0, y: 0, width: 10, height: 10, isRed: true } });
    expect(game.score).toBe(CONFIG.GAME.STAR_SCORE + CONFIG.GAME.STAR_SCORE_RED);
    unsub();
  });
});
