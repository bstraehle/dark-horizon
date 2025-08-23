import { CONFIG } from "../constants.js";

/**
 * Provides static methods for rendering the main game background gradient.
 */
export class Background {
  /**
   * Draws the background gradient.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} width - Canvas width in logical pixels.
   * @param {number} height - Canvas height in logical pixels.
   */
  static draw(ctx, width, height) {
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND.TOP);
    gradient.addColorStop(0.5, CONFIG.COLORS.BACKGROUND.MID);
    gradient.addColorStop(1, CONFIG.COLORS.BACKGROUND.BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
