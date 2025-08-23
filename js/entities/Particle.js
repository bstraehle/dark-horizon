import { CONFIG, PI2 } from '../constants.js';

/**
 * Models a single particle used in visual effects such as explosions, trails, or other dynamic elements.
 */
export class Particle {
    /**
     * Creates an instance of Particle.
     * @param {number} x - The x position of the particle.
     * @param {number} y - The y position of the particle.
     * @param {number} vx - The x velocity of the particle.
     * @param {number} vy - The y velocity of the particle.
     * @param {number} life - The current life of the particle.
     * @param {number} maxLife - The maximum life of the particle.
     * @param {number} size - The size of the particle.
     * @param {string} color - The color of the particle.
     */
    constructor(x, y, vx, vy, life, maxLife, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = maxLife;
        this.size = size;
        this.color = color;
    }

    /**
     * Updates the particle's position and life.
     * @param {number} dtSec - Delta time in seconds.
     */
    update(dtSec = CONFIG.TIME.DEFAULT_DT) {
        this.x += this.vx * dtSec;
        this.y += this.vy * dtSec;
        this.life -= dtSec;
        this.vy += CONFIG.PARTICLE.GRAVITY * dtSec;
    }

    /**
     * Draws the particle on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        ctx.save();
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, PI2);
        ctx.fill();
        ctx.restore();
    }

    /** Reset to a fresh state for pooling.
     * @param {number} x
     * @param {number} y
     * @param {number} vx
     * @param {number} vy
     * @param {number} life
     * @param {number} maxLife
     * @param {number} size
     * @param {string} color
     */
    reset(x, y, vx, vy, life, maxLife, size, color) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.maxLife = maxLife; this.size = size; this.color = color;
    }
}
