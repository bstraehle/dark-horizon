import { CONFIG, PI2 } from "../constants.js";

/**
 * Represents an asteroid obstacle in the game world, managing its position, movement, and visual appearance.
 */
export class Asteroid {
  /**
   * Creates an instance of Asteroid.
   * @param {number} x - The x position of the asteroid.
   * @param {number} y - The y position of the asteroid.
   * @param {number} width - The width of the asteroid.
   * @param {number} height - The height of the asteroid.
   * @param {number} speed - The speed of the asteroid.
   * @param {import('../types.js').RNGLike} [rng] - Optional RNG for crater placement.
   * @param {boolean} [isIndestructible=false] - If true, this asteroid cannot be destroyed by bullets.
   */
  constructor(x, y, width, height, speed, rng, isIndestructible = false, paletteOverride = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    /** @type {boolean} */
    this.isIndestructible = !!isIndestructible;
    /** Remaining time for shield hit flash (seconds) */
    this._shieldFlash = 0;
    const radius = this.width / 2;
    const craterCount = 3;
    const rand =
      rng && typeof rng.nextFloat === "function" ? rng : { nextFloat: Math.random.bind(Math) };
    // Keep a reference to the provided RNG (if any) so drawing can deterministically pick planet palettes
    this._rng = rng && typeof rng.nextFloat === "function" ? rng : null;
    this._craters = Array.from({ length: craterCount }, () => ({
      dx: (rand.nextFloat() - 0.5) * radius * 0.8,
      dy: (rand.nextFloat() - 0.5) * radius * 0.8,
      r: rand.nextFloat() * radius * 0.3 + 2,
    }));
    // Choose and store a visual palette once so the asteroid doesn't flicker between draws
    this._palette = CONFIG.COLORS.ASTEROID;
    if (this.isIndestructible) {
      // If a palette override was provided (from SpawnManager), prefer it.
      if (paletteOverride && typeof paletteOverride === "object") {
        this._palette = paletteOverride;
      } else {
        const planets = CONFIG.COLORS.ASTEROID_PLANETS;
        if (Array.isArray(planets) && planets.length > 0) {
          const idx = this._rng
            ? Math.floor(this._rng.nextFloat() * planets.length)
            : Math.floor(Math.random() * planets.length);
          this._palette = planets[idx];
        } else {
          this._palette = CONFIG.COLORS.ASTEROID_DARK || CONFIG.COLORS.ASTEROID;
        }
      }
    }
    // Apply palette-specific speed factor if present, otherwise default to provided speed
    const paletteSpeedFactor =
      this._palette && typeof this._palette.SPEED_FACTOR === "number"
        ? this._palette.SPEED_FACTOR
        : null;
    this.speed = paletteSpeedFactor ? speed * paletteSpeedFactor : speed;
  }

  /**
   * Updates the asteroid's position.
   * @param {number} dtSec - Delta time in seconds.
   */
  update(dtSec = CONFIG.TIME.DEFAULT_DT) {
    this.y += this.speed * dtSec;
    if (this.isIndestructible && this._shieldFlash > 0) {
      this._shieldFlash = Math.max(0, this._shieldFlash - dtSec);
    }
  }

  /**
   * Draws the asteroid on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;
    // Use the stored palette (chosen at creation/reset) to keep consistent look per asteroid
    const palette = this._palette || CONFIG.COLORS.ASTEROID;
    const shieldColor =
      (palette && palette.SHIELD) ||
      (CONFIG.COLORS.ASTEROID_HARD && CONFIG.COLORS.ASTEROID_HARD.SHIELD) ||
      "#7fc3ff";
    const asteroidGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
    asteroidGradient.addColorStop(0, palette.GRAD_IN);
    asteroidGradient.addColorStop(0.6, palette.GRAD_MID);
    asteroidGradient.addColorStop(1, palette.GRAD_OUT);
    ctx.fillStyle = asteroidGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, PI2);
    ctx.fill();
    ctx.fillStyle = palette.CRATER;
    for (const c of this._craters) {
      ctx.beginPath();
      ctx.arc(centerX + c.dx, centerY + c.dy, c.r, 0, PI2);
      ctx.fill();
    }
    ctx.strokeStyle = palette.OUTLINE;
    ctx.lineWidth = this.isIndestructible ? 3 : 2;
    ctx.stroke();

    // Indestructible asteroid impact effect: show blue ring only on bullet impact
    if (this.isIndestructible && this._shieldFlash > 0) {
      const t = Math.max(0, Math.min(1, this._shieldFlash / CONFIG.ASTEROID.SHIELD_FLASH_TIME));
      ctx.save();
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 2 + 2 * t;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 10 + 10 * t;
      ctx.globalAlpha = 0.6 + 0.6 * t;
      const ringR = radius * (1.05 + 0.05 * t);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringR, 0, PI2);
      ctx.stroke();
      ctx.restore();
    }
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
   * @param {import('../types.js').RNGLike} [rng]
   * @param {boolean} [isIndestructible=false]
   */
  reset(x, y, width, height, speed, rng, isIndestructible = false, paletteOverride = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.isIndestructible = !!isIndestructible;
    this._shieldFlash = 0;
    const radius = this.width / 2;
    const craterCount = 3;
    const rand =
      rng && typeof rng.nextFloat === "function" ? rng : { nextFloat: Math.random.bind(Math) };
    // Keep a reference to the provided RNG (if any) so drawing can deterministically pick planet palettes
    this._rng = rng && typeof rng.nextFloat === "function" ? rng : null;
    this._craters = Array.from({ length: craterCount }, () => ({
      dx: (rand.nextFloat() - 0.5) * radius * 0.8,
      dy: (rand.nextFloat() - 0.5) * radius * 0.8,
      r: rand.nextFloat() * radius * 0.3 + 2,
    }));
    // Recompute and store palette for this asteroid instance
    this._palette = CONFIG.COLORS.ASTEROID;
    if (this.isIndestructible) {
      if (paletteOverride && typeof paletteOverride === "object") {
        this._palette = paletteOverride;
      } else {
        const planets = CONFIG.COLORS.ASTEROID_PLANETS;
        if (Array.isArray(planets) && planets.length > 0) {
          const idx = this._rng
            ? Math.floor(this._rng.nextFloat() * planets.length)
            : Math.floor(Math.random() * planets.length);
          this._palette = planets[idx];
        } else {
          this._palette = CONFIG.COLORS.ASTEROID_DARK || CONFIG.COLORS.ASTEROID;
        }
      }
    }
    const paletteSpeedFactor =
      this._palette && typeof this._palette.SPEED_FACTOR === "number"
        ? this._palette.SPEED_FACTOR
        : null;
    this.speed = paletteSpeedFactor ? speed * paletteSpeedFactor : speed;
  }

  /** Trigger a brief shield hit flash (no-op for normal asteroids). */
  onShieldHit() {
    if (!this.isIndestructible) return;
    this._shieldFlash = CONFIG.ASTEROID.SHIELD_FLASH_TIME;
  }
}
