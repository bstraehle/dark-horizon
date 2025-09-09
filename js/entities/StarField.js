import { CONFIG } from "../constants.js";

/**
 * Provides static methods for initializing and rendering the animated star field background.
 */
export class StarField {
  /**
   * @typedef {Object} StarData
   * @property {number} x
   * @property {number} y
   * @property {number} size
   * @property {number} speed
   * @property {number} brightness
   */

  /**
   * Initializes the star field array.
   * @param {number} width - Canvas width in logical pixels.
   * @param {number} height - Canvas height in logical pixels.
   * @returns {StarData[]} Array of star objects.
   */
  /**
   * @param {number} width
   * @param {number} height
   * @param {import('../types.js').RNGLike} [rng]
   */
  static init(width, height, rng, isMobile = false) {
    const rand = rng || { nextFloat: Math.random.bind(Math) };
    const count = isMobile
      ? CONFIG.GAME.STARFIELD_COUNT_MOBILE || CONFIG.GAME.STARFIELD_COUNT
      : CONFIG.GAME.STARFIELD_COUNT;
    return Array.from({ length: count }, () => ({
      x: rand.nextFloat() * width,
      y: rand.nextFloat() * height,
      size: rand.nextFloat() * CONFIG.STARFIELD.SIZE_VAR + CONFIG.STARFIELD.SIZE_MIN,
      speed: rand.nextFloat() * CONFIG.STARFIELD.SPEED_VAR + CONFIG.STARFIELD.SPEED_MIN,
      brightness:
        rand.nextFloat() * CONFIG.STARFIELD.BRIGHTNESS_VAR + CONFIG.STARFIELD.BRIGHTNESS_MIN,
    }));
  }

  /**
   * Draws the star field on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} width - Canvas width in logical pixels.
   * @param {number} height - Canvas height in logical pixels.
   * @param {StarData[]} starField - Array of star objects.
   * @param {number} timeSec - Elapsed time in seconds for twinkle.
   * @param {boolean} [paused=false] - If true, star positions won't advance.
   * @param {number} [dtSec=CONFIG.TIME.DEFAULT_DT] - Delta time in seconds for movement, ignored if paused.
   * @param {{ nextFloat:()=>number }=} rng - Optional RNG-like with nextFloat()
   */
  static draw(
    ctx,
    width,
    height,
    starField,
    timeSec,
    paused = false,
    dtSec = CONFIG.TIME.DEFAULT_DT,
    rng = undefined
  ) {
    ctx.save();
    ctx.fillStyle = CONFIG.COLORS.STAR.GRAD_IN;
    starField.forEach((star) => {
      if (!paused) {
        star.y += star.speed * dtSec;
        if (star.y > height) {
          star.y = CONFIG.STARFIELD.RESET_Y;
          star.x = (rng ? rng.nextFloat() : Math.random()) * width;
        }
      }
      const twinkle =
        Math.sin(
          timeSec * CONFIG.STARFIELD.TWINKLE_RATE + star.x * CONFIG.STARFIELD.TWINKLE_X_FACTOR
        ) *
          0.3 +
        0.7;
      ctx.save();
      ctx.globalAlpha = star.brightness * twinkle;
      ctx.shadowColor = CONFIG.COLORS.STAR.GRAD_IN;
      ctx.shadowBlur = star.size * CONFIG.STARFIELD.SHADOW_BLUR_MULT;
      ctx.fillRect(star.x, star.y, star.size, star.size);
      ctx.restore();
    });
    ctx.restore();
  }

  /**
   * Resize an existing starField array proportionally from previous dimensions to new ones.
   * Returns a new array reference with scaled x/y positions. Sizes and speeds are scaled by the
   * average scale factor to preserve appearance.
   * @param {StarData[]} starField
   * @param {number} prevW
   * @param {number} prevH
   * @param {number} newW
   * @param {number} newH
   */
  static resize(starField, prevW, prevH, newW, newH) {
    if (!starField || prevW <= 0 || prevH <= 0) return starField;
    const sx = newW / prevW;
    const sy = newH / prevH;
    const sAvg = (sx + sy) / 2;
    return starField.map((s) => ({
      x: s.x * sx,
      y: s.y * sy,
      size: Math.max(1, s.size * sAvg),
      speed: s.speed * sAvg,
      brightness: s.brightness,
    }));
  }
}
