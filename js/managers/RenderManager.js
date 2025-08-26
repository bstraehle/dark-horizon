import { CONFIG } from "../constants.js";
export class RenderManager {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {any[]} asteroids
   */
  static drawAsteroids(ctx, asteroids) {
    for (let i = 0; i < asteroids.length; i++) {
      asteroids[i].draw(ctx);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {any[]} bullets
   * @param {any} sprites
   */
  static drawBullets(ctx, bullets, sprites) {
    const spr = sprites && sprites.bullet;
    const trail = (sprites && sprites.bulletTrail) || CONFIG.BULLET.TRAIL;
    if (spr) {
      const sw = spr.width,
        sh = spr.height;
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        const dh = b.height + trail;
        ctx.drawImage(spr, 0, 0, sw, sh, b.x, b.y, b.width, dh);
      }
    } else {
      for (let i = 0; i < bullets.length; i++) {
        bullets[i].draw(ctx);
      }
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {any[]} stars
   * @param {number} [timeSec]
   * @param {any} sprites
   */
  static drawCollectibleStars(ctx, stars, sprites, timeSec = 0) {
    const starSpr = sprites && sprites.star;
    const starRedSpr = sprites && /** @type {any} */ (sprites).starRed;
    const base = sprites && sprites.starBaseSize;
    if (starSpr && base) {
      for (let i = 0; i < stars.length; i++) {
        const s = /** @type {any} */ (stars[i]);
        const baseSize = Math.max(1, Math.min(s.width, s.height));
        let dw = baseSize,
          dh = baseSize;
        if (CONFIG.STAR.PULSE) {
          const amp = CONFIG.STAR.PULSE_AMPLITUDE;
          const speedHz = CONFIG.STAR.PULSE_SPEED;
          const pulse = Math.sin(timeSec * speedHz * CONFIG.TWO_PI) * amp + (1 - amp);
          dw = baseSize * pulse;
          dh = baseSize * pulse;
        }
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        const spr = s.isRed && starRedSpr ? starRedSpr : starSpr;
        ctx.drawImage(spr, 0, 0, base, base, cx - dw / 2, cy - dh / 2, dw, dh);
      }
    } else {
      for (let i = 0; i < stars.length; i++) {
        stars[i].draw(ctx, timeSec);
      }
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {any[]} explosions
   */
  static drawExplosions(ctx, explosions) {
    for (let i = 0; i < explosions.length; i++) {
      explosions[i].draw(ctx);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {any[]} particles
   */
  static drawParticles(ctx, particles) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw the entire game frame in the correct order.
   * @param {any} game
   */
  static draw(game) {
    // Draw background
    if (typeof game.drawBackground === "function") {
      game.drawBackground();
    }
    // Draw entities
    RenderManager.drawAsteroids(game.ctx, game.asteroids);
    RenderManager.drawBullets(game.ctx, game.bullets, game.sprites);
    RenderManager.drawCollectibleStars(game.ctx, game.stars, game.sprites, game.timeSec);
    RenderManager.drawExplosions(game.ctx, game.explosions);
    RenderManager.drawParticles(game.ctx, game.particles);
    // Draw player and engine trail
    if (game.player && typeof game.player.draw === "function") {
      game.player.draw(game.ctx);
    }
    if (game.engineTrail && typeof game.engineTrail.draw === "function") {
      game.engineTrail.draw(game.ctx);
    }
  }
}
