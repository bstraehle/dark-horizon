import { CONFIG, PI2 } from '../constants.js';

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
     */
    constructor(x, y, width, height, speed, rng) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        const radius = this.width / 2;
        const craterCount = 3;
        const rand = rng && typeof rng.nextFloat === 'function' ? rng : { nextFloat: Math.random.bind(Math) };
        this._craters = Array.from({ length: craterCount }, () => ({
            dx: (rand.nextFloat() - 0.5) * radius * 0.8,
            dy: (rand.nextFloat() - 0.5) * radius * 0.8,
            r: rand.nextFloat() * radius * 0.3 + 2
        }));
    }

    /**
     * Updates the asteroid's position.
     * @param {number} dtSec - Delta time in seconds.
     */
    update(dtSec = CONFIG.TIME.DEFAULT_DT) {
        this.y += this.speed * dtSec;
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
        const asteroidGradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, 0, centerX, centerY, radius);
        asteroidGradient.addColorStop(0, CONFIG.COLORS.ASTEROID.GRAD_IN);
        asteroidGradient.addColorStop(0.6, CONFIG.COLORS.ASTEROID.GRAD_MID);
        asteroidGradient.addColorStop(1, CONFIG.COLORS.ASTEROID.GRAD_OUT);
        ctx.fillStyle = asteroidGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, PI2);
        ctx.fill();
        ctx.fillStyle = CONFIG.COLORS.ASTEROID.CRATER;
        for (const c of this._craters) {
            ctx.beginPath();
            ctx.arc(centerX + c.dx, centerY + c.dy, c.r, 0, PI2);
            ctx.fill();
        }
        ctx.strokeStyle = CONFIG.COLORS.ASTEROID.OUTLINE;
        ctx.lineWidth = 2;
        ctx.stroke();
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
     */
    reset(x, y, width, height, speed, rng) {
        this.x = x; this.y = y; this.width = width; this.height = height; this.speed = speed;
        const radius = this.width / 2;
        const craterCount = 3;
        const rand = rng && typeof rng.nextFloat === 'function' ? rng : { nextFloat: Math.random.bind(Math) };
        this._craters = Array.from({ length: craterCount }, () => ({
            dx: (rand.nextFloat() - 0.5) * radius * 0.8,
            dy: (rand.nextFloat() - 0.5) * radius * 0.8,
            r: rand.nextFloat() * radius * 0.3 + 2
        }));
    }
}
