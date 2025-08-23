import { CONFIG } from "../constants.js";

/**
 * Models a single star in the background, including its animation and rendering.
 */
export class Star {
  /**
   * Creates an instance of Star.
   * @param {number} x - The x position of the star.
   * @param {number} y - The y position of the star.
   * @param {number} width - The width of the star.
   * @param {number} height - The height of the star.
   * @param {number} speed - The speed of the star.
   */
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  /**
   * Updates the star's position.
   * @param {number} dtSec - Delta time in seconds.
   */
  update(dtSec = CONFIG.TIME.DEFAULT_DT) {
    this.y += this.speed * dtSec;
  }

  /**
   * Draws the star on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} timeSec - Elapsed time in seconds for pulsing.
   */
  draw(ctx, timeSec) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const size = this.width / 2;
    let scaledSize = size;
    if (CONFIG.STAR.PULSE) {
      const amp = CONFIG.STAR.PULSE_AMPLITUDE;
      const speedHz = CONFIG.STAR.PULSE_SPEED;
      const pulse = Math.sin(timeSec * speedHz * 2 * Math.PI) * amp + (1 - amp);
      scaledSize = size * pulse;
    }

    ctx.shadowColor = CONFIG.COLORS.STAR.BASE;
    ctx.shadowBlur = CONFIG.STAR.SHADOW_BLUR;

    const starGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      scaledSize
    );
    starGradient.addColorStop(0, CONFIG.COLORS.STAR.GRAD_IN);
    starGradient.addColorStop(0.3, CONFIG.COLORS.STAR.GRAD_MID);
    starGradient.addColorStop(1, CONFIG.COLORS.STAR.GRAD_OUT);

    ctx.fillStyle = starGradient;
    Star.drawStar(ctx, centerX, centerY, scaledSize);
    ctx.restore();
  }

  /** Returns the axis-aligned bounding box for collisions.
   * @returns {import('../types.js').Rect}
   */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /** Reset to a fresh state for pooling.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} speed
   */
  reset(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  /**
   * Draws a star shape.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} x - The x position of the star.
   * @param {number} y - The y position of the star.
   * @param {number} size - The size of the star.
   */
  static drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x1 = x + size * Math.cos(angle);
      const y1 = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      const innerAngle = angle + Math.PI / 5;
      const x2 = x + size * 0.4 * Math.cos(innerAngle);
      const y2 = y + size * 0.4 * Math.sin(innerAngle);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
  }
}
