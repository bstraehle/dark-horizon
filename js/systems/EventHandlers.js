// @ts-nocheck
import { CONFIG } from "../constants.js";

/**
 * Centralizes EventBus subscriptions and their gameplay side-effects.
 */
export const EventHandlers = {
  /**
   * Wire up event handlers for the given game instance.
   * Returns an unsubscribe function to remove all handlers if needed.
   * @param {any} game
   * @returns {()=>void}
   */
  register(game) {
    const { events } = game;
    /** @type {Array<() => void>} */
    const unsubs = [];

    // Bullet hits asteroid → score, explosion, score UI
    unsubs.push(
      // @ts-ignore
      /** @param {any} payload */
      events.on("bulletHitAsteroid", function (payload) {
        const { asteroid } = payload;
        game.score += CONFIG.GAME.ASTEROID_SCORE;
        game.createExplosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        game.updateScore();
      })
    );

    // Player collides with asteroid → game over
    unsubs.push(
      events.on("playerHitAsteroid", () => {
        game.gameOver();
      })
    );

    // Player collects star → score, score UI
    unsubs.push(
      // @ts-ignore
      /** @param {any} payload */
      events.on("collectedStar", function (payload) {
        const { star } = payload;
        const add = star && star.isRed ? CONFIG.GAME.STAR_SCORE_RED : CONFIG.GAME.STAR_SCORE;
        game.score += add;
        game.updateScore();
      })
    );

    // Visual burst for star collection (moved from CollisionManager)
    unsubs.push(
      // @ts-ignore
      /** @param {any} payload */
      events.on("collectedStar", function (payload) {
        const { star } = payload;
        const rng = game.rng;
        for (let p = 0; p < CONFIG.STAR.PARTICLE_BURST; p++) {
          game.particles.push(
            game.particlePool.acquire(
              star.x + star.width / 2,
              star.y + star.height / 2,
              Math.cos((CONFIG.TWO_PI * p) / CONFIG.STAR.PARTICLE_BURST) *
                (rng.range(0, CONFIG.STAR.PARTICLE_BURST_SPEED_VAR) +
                  CONFIG.STAR.PARTICLE_BURST_SPEED_MIN),
              Math.sin((CONFIG.TWO_PI * p) / CONFIG.STAR.PARTICLE_BURST) *
                (rng.range(0, CONFIG.STAR.PARTICLE_BURST_SPEED_VAR) +
                  CONFIG.STAR.PARTICLE_BURST_SPEED_MIN),
              CONFIG.STAR.PARTICLE_LIFE,
              CONFIG.STAR.PARTICLE_LIFE,
              rng.range(0, CONFIG.STAR.PARTICLE_SIZE_VARIATION) + CONFIG.STAR.PARTICLE_SIZE_MIN,
              star && star.isRed ? CONFIG.COLORS.STAR_RED.BASE : CONFIG.COLORS.STAR.BASE
            )
          );
        }
      })
    );

    return () => {
      for (const off of unsubs) off();
    };
  },
};
