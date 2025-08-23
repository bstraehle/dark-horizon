import { clamp, CONFIG, PI2 } from '../constants.js';
/** @typedef {{ [code:string]: boolean }} KeyMap */
/** @typedef {{ x:number, y:number }} Point */
/** @typedef {{ width:number, height:number }} ViewSize */

/**
 * Represents the player-controlled spaceship, including movement, input handling, and rendering.
 */
export class Player {
    /**
     * Creates an instance of Player.
     * @param {number} x - The x position of the player ship.
     * @param {number} y - The y position of the player ship.
     * @param {number} width - The width of the player ship.
     * @param {number} height - The height of the player ship.
     * @param {number} speed - The speed of the player ship.
     */
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    /**
     * Updates the player's position based on input or mouse position.
     * @param {KeyMap} input - Keyboard map keyed by KeyboardEvent.code.
     * @param {Point} mousePos - Mouse position in CSS pixels (0 disables mouse follow).
     * @param {ViewSize} view - Logical viewport dimensions.
     * @param {number} [dtSec=CONFIG.TIME.DEFAULT_DT] - Delta time in seconds.
     */
    update(input, mousePos, view, dtSec = CONFIG.TIME.DEFAULT_DT) {
        const keyboardPressed = input['ArrowLeft'] || input['KeyA'] ||
            input['ArrowRight'] || input['KeyD'] ||
            input['ArrowUp'] || input['KeyW'] ||
            input['ArrowDown'] || input['KeyS'];
        if (keyboardPressed) {
            const s = this.speed * dtSec;
            if (input['ArrowLeft'] || input['KeyA']) this.x -= s;
            if (input['ArrowRight'] || input['KeyD']) this.x += s;
            if (input['ArrowUp'] || input['KeyW']) this.y -= s;
            if (input['ArrowDown'] || input['KeyS']) this.y += s;
        } else if (mousePos.x > 0 && mousePos.y > 0) {
            const targetX = mousePos.x - this.width / 2;
            const targetY = mousePos.y - this.height / 2;
            const lerp = Math.min(1, 6 * dtSec);
            this.x += (targetX - this.x) * lerp;
            this.y += (targetY - this.y) * lerp;
        }
        this.x = clamp(this.x, 0, view.width - this.width);
        this.y = clamp(this.y, 0, view.height - this.height);
    }

    /**
     * Draws the player ship on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        Player.drawEngineGlow(ctx, centerX, this.y + this.height);
        const shipGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        shipGradient.addColorStop(0, CONFIG.COLORS.PLAYER.GRAD_TOP);
        shipGradient.addColorStop(0.5, CONFIG.COLORS.PLAYER.GRAD_MID);
        shipGradient.addColorStop(1, CONFIG.COLORS.PLAYER.GRAD_BOTTOM);
        ctx.fillStyle = shipGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, this.y);
        ctx.lineTo(this.x - 10, this.y + this.height * 0.55);
        ctx.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height);
        ctx.lineTo(centerX, this.y + this.height * 0.95);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width + 10, this.y + this.height * 0.55);
        ctx.lineTo(centerX, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = CONFIG.COLORS.PLAYER.OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = CONFIG.COLORS.PLAYER.COCKPIT;
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + this.height * 0.32, 4, 3, 0, 0, PI2);
        ctx.fill();
        ctx.fillStyle = CONFIG.COLORS.PLAYER.GUN;
        ctx.fillRect(centerX - 2, this.y - 8, 4, 10);
        ctx.restore();
    }

    /** Returns the axis-aligned bounding box for collisions. */
    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    /**
     * Draws the engine glow for the player ship.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {number} x - X position for the glow.
     * @param {number} y - Y position for the glow.
     */
    static drawEngineGlow(ctx, x, y) {
        ctx.save();
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, CONFIG.COLORS.ENGINE.GLOW1);
        gradient.addColorStop(0.5, CONFIG.COLORS.ENGINE.GLOW2);
        gradient.addColorStop(1, CONFIG.COLORS.ENGINE.GLOW3);
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 20, y, 40, 30);
        ctx.restore();
    }
}
