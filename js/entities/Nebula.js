import { CONFIG, PI2 } from '../constants.js';

/**
 * Class representing nebula visual effects for the game background.
 * Provides static methods to initialize and render nebula gradients.
 *
 * Nebulae are rendered as radial gradients with randomized positions, radii, and colors.
 */
export class Nebula {
    /**
     * @typedef {Object} NebulaBlob
     * @property {number} baseOx
     * @property {number} baseOy
     * @property {number} ox
     * @property {number} oy
     * @property {number} r
     * @property {number} rot
     * @property {number} sx
     * @property {number} sy
     * @property {number} wobbleAmp
     * @property {number} wobbleRate
     * @property {number} wobbleOffset
     */

    /**
     * @typedef {Object} NebulaConfig
     * @property {number} x
     * @property {number} y
     * @property {number} r
     * @property {string} color0
     * @property {string} color1
     * @property {number} dx
     * @property {number} dy
     * @property {number} dr
     * @property {number} t
     * @property {NebulaBlob[]} blobs
     */

    /**
     * Initializes nebula configurations for rendering.
     * Generates an array of nebula objects with randomized position, radius, and color properties.
     *
     * @param {number} width - Canvas width in logical pixels.
     * @param {number} height - Canvas height in logical pixels.
     * @param {boolean} isMobile - Indicates if the rendering is for a mobile device, affecting nebula count and size.
     * @returns {NebulaConfig[]} Array of nebula configuration objects, each containing x, y, r, color0, and color1.
     */
    /**
     * @param {number} width
     * @param {number} height
     * @param {boolean} isMobile
     * @param {import('../types.js').RNGLike} [rng]
     */
    static init(width, height, isMobile, rng) {
        const nebulaColors = [
            { color0: CONFIG.COLORS.NEBULA.N1, color1: CONFIG.COLORS.NEBULA.N1_OUT },
            { color0: CONFIG.COLORS.NEBULA.N2, color1: CONFIG.COLORS.NEBULA.N2_OUT },
            { color0: CONFIG.COLORS.NEBULA.N3, color1: CONFIG.COLORS.NEBULA.N3_OUT },
            { color0: CONFIG.COLORS.NEBULA.N4, color1: CONFIG.COLORS.NEBULA.N4_OUT }
        ];
        const count = isMobile ? CONFIG.NEBULA.COUNT_MOBILE : CONFIG.NEBULA.COUNT_DESKTOP;
        const radiusMin = isMobile ? CONFIG.NEBULA.RADIUS_MIN_MOBILE : CONFIG.NEBULA.RADIUS_MIN_DESKTOP;
        const radiusMax = isMobile ? CONFIG.NEBULA.RADIUS_MAX_MOBILE : CONFIG.NEBULA.RADIUS_MAX_DESKTOP;
        const rand = rng || { nextFloat: Math.random.bind(Math) };
        return Array.from({ length: count }, () => {
            const colorSet = nebulaColors[Math.floor(rand.nextFloat() * nebulaColors.length)];
            const baseR = rand.nextFloat() * radiusMax + radiusMin;
            const blobCount = (isMobile ? 3 : 5) + Math.floor(rand.nextFloat() * (isMobile ? 2 : 3));
            const blobs = Array.from({ length: blobCount }, () => {
                const dist = rand.nextFloat() * baseR * 0.6;
                const ang = rand.nextFloat() * Math.PI * 2;
                const r = baseR * (0.35 + rand.nextFloat() * 0.6);
                const sx = 0.8 + rand.nextFloat() * 1.2;
                const sy = 0.6 + rand.nextFloat() * 1.0;
                return {
                    baseOx: Math.cos(ang) * dist,
                    baseOy: Math.sin(ang) * dist,
                    ox: 0,
                    oy: 0,
                    r,
                    rot: rand.nextFloat() * Math.PI * 2,
                    sx,
                    sy,
                    wobbleAmp: 4 + rand.nextFloat() * 8,
                    wobbleRate: (0.002 + rand.nextFloat() * 0.004) * 60,
                    wobbleOffset: rand.nextFloat() * 1000
                };
            });
            return {
                x: rand.nextFloat() * width,
                y: rand.nextFloat() * height,
                r: baseR,
                color0: colorSet.color0,
                color1: colorSet.color1,
                dx: ((rand.nextFloat() - 0.5) * 0.4) * 60,
                dy: ((rand.nextFloat() - 0.5) * 0.4) * 60,
                dr: ((rand.nextFloat() - 0.5) * 0.15) * 60,
                t: rand.nextFloat() * 10,
                blobs
            };
        });
    }

    /**
     * Animates nebula by updating position and radius over time.
     * @param {number} width - Canvas width in logical pixels.
     * @param {number} height - Canvas height in logical pixels.
     * @param {NebulaConfig[]} nebulaConfigs - Array of nebula configuration objects.
     * @param {boolean} isMobile - Indicates if the rendering is for a mobile device, affecting nebula count and size.
     */
    /**
     * @param {number} width
     * @param {number} height
     * @param {NebulaConfig[]} nebulaConfigs
     * @param {boolean} isMobile
     * @param {number} [dtSec]
     */
    static update(width, height, nebulaConfigs, isMobile, dtSec = CONFIG.TIME.DEFAULT_DT) {
        for (const nebula of nebulaConfigs) {
            nebula.x += nebula.dx * dtSec;
            nebula.y += nebula.dy * dtSec;
            nebula.r += nebula.dr * dtSec;
            nebula.t += dtSec;
            const radiusMin = isMobile ? CONFIG.NEBULA.RADIUS_MIN_MOBILE : CONFIG.NEBULA.RADIUS_MIN_DESKTOP;
            const radiusMax = isMobile ? CONFIG.NEBULA.RADIUS_MAX_MOBILE : CONFIG.NEBULA.RADIUS_MAX_DESKTOP;
            if (nebula.x < 0 || nebula.x > width) nebula.dx *= -1;
            if (nebula.y < 0 || nebula.y > height) nebula.dy *= -1;
            if (nebula.r < radiusMin || nebula.r > radiusMax) nebula.dr *= -1;
            if (nebula.blobs) {
                for (let i = 0; i < nebula.blobs.length; i++) {
                    const b = nebula.blobs[i];
                    const phase = nebula.t * b.wobbleRate + b.wobbleOffset;
                    const wobX = Math.cos(phase) * b.wobbleAmp;
                    const wobY = Math.sin(phase * 0.9) * b.wobbleAmp * 0.7;
                    b.ox = b.baseOx + wobX;
                    b.oy = b.baseOy + wobY;
                }
            }
        }
    }

    /**
     * Draws nebula gradients on the canvas using the provided nebula configurations.
     * Each nebula is rendered as a radial gradient at its specified position and radius.
     *
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {NebulaConfig[]} nebulaConfigs - Array of nebula configuration objects from Nebula.init().
     */
    static draw(ctx, nebulaConfigs) {
        ctx.save();
        for (const nebula of nebulaConfigs) {
            const blobs = nebula.blobs || [{
                ox: 0, oy: 0, r: nebula.r, rot: 0, sx: 1, sy: 1
            }];
            for (const b of blobs) {
                ctx.save();
                ctx.translate(nebula.x + (b.ox || 0), nebula.y + (b.oy || 0));
                ctx.rotate(b.rot || 0);
                ctx.scale(b.sx || 1, b.sy || 1);
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r || nebula.r);
                grad.addColorStop(0, nebula.color0);
                grad.addColorStop(1, nebula.color1);
                ctx.fillStyle = grad;
                ctx.globalCompositeOperation = 'lighter';
                ctx.beginPath();
                ctx.arc(0, 0, b.r || nebula.r, 0, PI2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }
}
