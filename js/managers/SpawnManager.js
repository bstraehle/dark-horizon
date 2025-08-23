import { CONFIG } from '../constants.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Star } from '../entities/Star.js';
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
 */

/**
 * @typedef {Object} StarCreateSlice
 * @property {RNGLike} rng
 * @property {ViewSize} view
 * @property {number} starSpeed
 * @property {StarPool | null | undefined} [starPool]
 */

/**
 * SpawnManager handles probabilistic spawning and entity creation.
 *
 * Probability model per tick uses a Poisson process:
 *   p(spawn in dt) = 1 - exp(-lambda * dt)
 * where `lambda` is the per-second spawn rate from CONFIG.
 */
export class SpawnManager {
    /**
     * Randomly spawn asteroids and collectible stars.
     * @param {SpawnGameSlice} game - Minimal game slice.
     * @param {number} [dtSec=CONFIG.TIME.DEFAULT_DT] - Delta time in seconds for this update tick.
     * @returns {void}
     */
    static spawnObjects(game, dtSec) {
        const dt = typeof dtSec === 'number' ? dtSec : CONFIG.TIME.DEFAULT_DT;
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
        const width = CONFIG.ASTEROID.MIN_SIZE + rng.nextFloat() * CONFIG.ASTEROID.SIZE_VARIATION;
        const height = CONFIG.ASTEROID.MIN_SIZE + rng.nextFloat() * CONFIG.ASTEROID.SIZE_VARIATION;
        const speed = game.asteroidSpeed + rng.nextFloat() * CONFIG.ASTEROID.SPEED_VARIATION;
        const minX = CONFIG.ASTEROID.HORIZONTAL_MARGIN / 2;
        const maxX = Math.max(minX, game.view.width - width - CONFIG.ASTEROID.HORIZONTAL_MARGIN / 2);
        const x = minX + rng.nextFloat() * (maxX - minX);
        return game.asteroidPool ? game.asteroidPool.acquire(x, CONFIG.ASTEROID.SPAWN_Y, width, height, speed, rng) : new Asteroid(x, CONFIG.ASTEROID.SPAWN_Y, width, height, speed, rng);
    }

    /**
     * Create a new collectible star using game state for dimensions and speeds.
     * @param {StarCreateSlice} game
     * @returns {Star}
     */
    static createStar(game) {
        const rng = game.rng;
        const size = CONFIG.STAR.MIN_SIZE + rng.nextFloat() * CONFIG.STAR.SIZE_VARIATION;
        const width = size;
        const height = size;
        const speed = game.starSpeed + rng.range(0, 30);
        const minX = CONFIG.STAR.HORIZONTAL_MARGIN / 2;
        const maxX = Math.max(minX, game.view.width - width - CONFIG.STAR.HORIZONTAL_MARGIN / 2);
        const x = minX + rng.nextFloat() * (maxX - minX);
        return game.starPool ? game.starPool.acquire(x, CONFIG.STAR.SPAWN_Y, width, height, speed) : new Star(x, CONFIG.STAR.SPAWN_Y, width, height, speed);
    }
}
