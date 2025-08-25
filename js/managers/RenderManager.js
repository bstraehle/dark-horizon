import { CONFIG } from "../constants.js";

/**
 * RenderManager centralizes drawing routines for game entities.
 */
export class RenderManager {
  /**
   * Draw all asteroids.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ draw:(ctx:CanvasRenderingContext2D)=>void }>} asteroids
   */
  static drawAsteroids(ctx, asteroids) {
    for (let i = 0; i < asteroids.length; i++) {
      asteroids[i].draw(ctx);
    }
  }

  /**
   * Draw all bullets with optional sprite/trail.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ x:number, y:number, width:number, height:number, draw:(ctx:CanvasRenderingContext2D)=>void }>} bullets
   * @param {Partial<import('../types.js').SpriteAtlas>} [sprites]
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
   * Draw collectible stars with pulsing and glow effects if sprite available.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ x:number, y:number, width:number, height:number, draw:(ctx:CanvasRenderingContext2D, t:number)=>void }>} stars
   * @param {number} [timeSec=0]
   * @param {Partial<import('../types.js').SpriteAtlas>} [sprites]
   */
  static drawCollectibleStars(ctx, stars, timeSec = 0, sprites) {
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
          const pulse = Math.sin(timeSec * speedHz * Math.PI * 2) * amp + (1 - amp);
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
   * Draw explosion effects.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ draw:(ctx:CanvasRenderingContext2D)=>void }>} explosions
   */
  static drawExplosions(ctx, explosions) {
    for (let i = 0; i < explosions.length; i++) {
      explosions[i].draw(ctx);
    }
  }

  /**
   * Draw all particles; resets alpha at the end.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ draw:(ctx:CanvasRenderingContext2D)=>void }>} particles
   */
  static drawParticles(ctx, particles) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx);
    }
    ctx.globalAlpha = 1;
  }
}
