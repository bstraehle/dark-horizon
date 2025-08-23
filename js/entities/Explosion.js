import { CONFIG, PI2 } from "../constants.js";

/**
 * Handles the visual representation and animation of explosion effects for collisions and object destruction.
 */
export class Explosion {
  /**
   * Creates an instance of Explosion.
   * @param {number} x - The x position of the explosion.
   * @param {number} y - The y position of the explosion.
   * @param {number} width - The width of the explosion.
   * @param {number} height - The height of the explosion.
   * @param {number} life - The current life of the explosion.
   * @param {number} maxLife - The maximum life of the explosion.
   */
  constructor(x, y, width, height, life, maxLife) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.life = life;
    this.maxLife = maxLife;
  }

  /**
   * Updates the explosion's remaining life.
   * @param {number} dtSec - Delta time in seconds.
   */
  update(dtSec = CONFIG.TIME.DEFAULT_DT) {
    this.life -= dtSec;
  }

  /**
   * Draws the explosion on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  draw(ctx) {
    ctx.save();
    const alpha = this.life / this.maxLife;
    const scale = 1 + (1 - alpha) * CONFIG.EXPLOSION.SCALE_GAIN;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = (this.width / 2) * scale;
    const explosionGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    explosionGradient.addColorStop(0, `${CONFIG.COLORS.EXPLOSION.GRAD_IN}${alpha})`);
    explosionGradient.addColorStop(0.3, `${CONFIG.COLORS.EXPLOSION.GRAD_MID1}${alpha * 0.8})`);
    explosionGradient.addColorStop(0.7, `${CONFIG.COLORS.EXPLOSION.GRAD_MID2}${alpha * 0.6})`);
    explosionGradient.addColorStop(1, CONFIG.COLORS.EXPLOSION.GRAD_OUT);
    ctx.fillStyle = explosionGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI2);
    ctx.fill();
    ctx.restore();
  }

  /** Reset to a fresh state for pooling.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} life
   * @param {number} maxLife
   */
  reset(x, y, width, height, life, maxLife) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.life = life;
    this.maxLife = maxLife;
  }
}
