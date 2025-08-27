import { CONFIG } from "../constants.js";
import { Asteroid } from "../entities/Asteroid.js";
import { Star } from "../entities/Star.js";
/** @typedef {import('../types.js').RNGLike} RNGLike */
/** @typedef {import('../types.js').Pool<Asteroid>} AsteroidPool */
/** @typedef {import('../types.js').Pool<Star>} StarPool */

/** @typedef {{ width:number, height:number }} ViewSize */

/**
 * @typedef {Object} SpawnGameSlice
 * @property {RNGLike} rng
 * @property {ViewSize} view
 * @property {number} asteroidSpeed
 * @property {number} starSpeed
 * @property {AsteroidPool | null | undefined} [asteroidPool]
 * @property {StarPool | null | undefined} [starPool]
 * @property {Asteroid[]} asteroids
 * @property {Star[]} stars
 */

/**
 * @typedef {Object} AsteroidCreateSlice
 * @property {RNGLike} rng
 * @property {ViewSize} view
 * @property {number} asteroidSpeed
 * @property {AsteroidPool | null | undefined} [asteroidPool]
 * @property {number} [_normalAsteroidCount]
 */

/**
 * @typedef {Object} StarCreateSlice
 * @property {RNGLike} rng
 * @property {ViewSize} view
 * @property {number} starSpeed
 * @property {StarPool | null | undefined} [starPool]
 * @property {number} [_yellowStarCount]
 */

/**
 * SpawnManager handles probabilistic spawning and entity creation.
 *
 * Probability model per tick uses a Poisson process:
 *   p(spawn in dt) = 1 - exp(-lambda * dt)
 * where `lambda` is the per-second spawn rate from CONFIG.
 */
export class SpawnManager {
  /** @type {WeakMap<object, { yellowCount:number, normalAsteroidCount:number }>} */
  static #STATE = new WeakMap();

  /**
   * Get or create per-game spawn counters.
   * @param {object} game
   */
  static #state(game) {
    let st = this.#STATE.get(game);
    if (!st) {
      st = { yellowCount: 0, normalAsteroidCount: 0 };
      this.#STATE.set(game, st);
    }
    return st;
  }

  /**
   * Reset spawn counters for the given game instance.
   * Safe to call at start/reset.
   * @param {object} game
   */
  static reset(game) {
    this.#STATE.delete(game);
  }
  /**
   * Randomly spawn asteroids and collectible stars.
   * @param {SpawnGameSlice} game - Minimal game slice.
   * @param {number} [dtSec=CONFIG.TIME.DEFAULT_DT] - Delta time in seconds for this update tick.
   * @returns {void}
   */
  static spawnObjects(game, dtSec) {
    const dt = typeof dtSec === "number" ? dtSec : CONFIG.TIME.DEFAULT_DT;
    const rng = game.rng;
    const pAst = 1 - Math.exp(-CONFIG.GAME.ASTEROID_SPAWN_RATE * dt);
    const pStar = 1 - Math.exp(-CONFIG.GAME.STAR_SPAWN_RATE * dt);
    if (rng.nextFloat() < pAst) game.asteroids.push(this.createAsteroid(game));
    if (rng.nextFloat() < pStar) game.stars.push(this.createStar(game));
  }

  /**
   * Create a new asteroid using game state for dimensions and speeds.
   * @param {AsteroidCreateSlice} game
   * @returns {Asteroid}
   */
  static createAsteroid(game) {
    const rng = game.rng;
    const st = this.#state(game);
    // Determine indestructible asteroid cadence from config before selecting sizes
    const asteroidThreshold = CONFIG.GAME.ASTEROID_NORMAL_BEFORE_INDESTRUCTIBLE | 0 || 10;
    const count = st.normalAsteroidCount | 0;
    const isIndestructible = count >= asteroidThreshold;
    st.normalAsteroidCount = isIndestructible ? 0 : count + 1;

    // Base size then apply size factor depending on type
    const baseSize = CONFIG.ASTEROID.MIN_SIZE + rng.nextFloat() * CONFIG.ASTEROID.SIZE_VARIATION;
    const sizeFactor = isIndestructible
      ? CONFIG.ASTEROID.INDESTRUCTIBLE_SIZE_FACTOR
      : CONFIG.ASTEROID.REGULAR_SIZE_FACTOR;
    const width = Math.max(4, Math.round(baseSize * sizeFactor));
    const height = Math.max(4, Math.round(baseSize * sizeFactor));
    const speed = game.asteroidSpeed + rng.nextFloat() * CONFIG.ASTEROID.SPEED_VARIATION;
    const minX = CONFIG.ASTEROID.HORIZONTAL_MARGIN / 2;
    const maxX = Math.max(minX, game.view.width - width - CONFIG.ASTEROID.HORIZONTAL_MARGIN / 2);
    const x = minX + rng.nextFloat() * (maxX - minX);
    return game.asteroidPool
      ? game.asteroidPool.acquire(
          x,
          CONFIG.ASTEROID.SPAWN_Y,
          width,
          height,
          speed,
          rng,
          isIndestructible
        )
      : new Asteroid(x, CONFIG.ASTEROID.SPAWN_Y, width, height, speed, rng, isIndestructible);
  }

  /**
   * Create a new collectible star using game state for dimensions and speeds.
   * @param {StarCreateSlice} game
   * @returns {Star}
   */
  static createStar(game) {
    const rng = game.rng;
    const st = this.#state(game);
    const size = CONFIG.STAR.MIN_SIZE + rng.nextFloat() * CONFIG.STAR.SIZE_VARIATION;
    const width = size;
    const height = size;
    // rng.range may be unavailable on foreign RNGLike implementations; guard it.
    const jitter = typeof rng.range === "function" ? rng.range(0, CONFIG.STAR.SPEED_VARIATION) : 0;
    const speed = game.starSpeed + jitter;
    const minX = CONFIG.STAR.HORIZONTAL_MARGIN / 2;
    const maxX = Math.max(minX, game.view.width - width - CONFIG.STAR.HORIZONTAL_MARGIN / 2);
    const x = minX + rng.nextFloat() * (maxX - minX);
    // Determine if this star should be a red bonus star
    // Determine red star cadence from config (number of yellow stars before a red appears).
    const starThreshold = CONFIG.GAME.STAR_YELLOW_BEFORE_RED | 0 || 10;
    const count = st.yellowCount | 0;
    const isRed = count >= starThreshold;
    // Track yellows: after `starThreshold` yellows, spawn one red and reset
    st.yellowCount = isRed ? 0 : count + 1;

    return game.starPool
      ? game.starPool.acquire(x, CONFIG.STAR.SPAWN_Y, width, height, speed, isRed)
      : new Star(x, CONFIG.STAR.SPAWN_Y, width, height, speed, isRed);
  }
}
