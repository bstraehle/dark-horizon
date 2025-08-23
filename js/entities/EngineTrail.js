import { CONFIG, PI2 } from '../constants.js';

/**
 * Manages and renders the glowing engine trail particles emitted by the player ship.
 */
export class EngineTrail {
    constructor() {
        this.particles = [];
    }

    /**
     * Adds a new particle to the engine trail.
     * @param {{x:number,y:number,width:number,height:number}} player - Player-like object.
     * @param {import('../types.js').RNGLike} [rng]
     */
    add(player, rng) {
        const centerX = player.x + player.width / 2;
        const trailY = player.y + player.height;
        const maxLife = CONFIG.ENGINE_TRAIL.LIFE;
        const jitter = CONFIG.ENGINE_TRAIL.SPAWN_JITTER;
        const sizeMin = CONFIG.ENGINE_TRAIL.SIZE_MIN;
        const sizeMax = CONFIG.ENGINE_TRAIL.SIZE_MAX;
        this.particles.push({
            x: centerX + (rng ? (rng.nextFloat() - 0.5) : (Math.random() - 0.5)) * jitter,
            y: trailY,
            life: maxLife,
            maxLife,
            size: (rng ? rng.range(0, sizeMax) : Math.random() * sizeMax) + sizeMin
        });
    }

    /**
     * Updates all engine trail particles.
     */
    update(dtSec = CONFIG.TIME.DEFAULT_DT) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.y += CONFIG.ENGINE_TRAIL.SPEED * dtSec;
            particle.life -= dtSec;
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draws all engine trail particles.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        ctx.save();
        this.particles.forEach(particle => {
            const alpha = Math.max(0, Math.min(1, particle.life / (particle.maxLife || 0.33)));
            ctx.globalAlpha = alpha;
            const trailGradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            trailGradient.addColorStop(0, CONFIG.COLORS.ENGINE.GLOW1);
            trailGradient.addColorStop(1, CONFIG.COLORS.ENGINE.GLOW3);
            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, PI2);
            ctx.fill();
        });
        ctx.restore();
    }
}
