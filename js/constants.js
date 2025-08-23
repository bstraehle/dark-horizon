/**
 * Dark Horizon game configuration constants.
 * The exported object is deeply frozen to prevent accidental mutation at runtime.
 *
 * @constant
 * @type {Readonly<{
 *  COLORS: any,
 *  ASTEROID: any,
 *  BULLET: any,
 *  EXPLOSION: any,
 *  GAME: any,
 *  INPUT: any,
 *  NEBULA: any,
 *  PLAYER: any,
 *  SIZES: any,
 *  SPEEDS: any,
 *  STAR: any,
 *  UI: any,
 * }>} CONFIG
 */
const COLORS = deepFreeze({
    ASTEROID: {
        CRATER: '#555',
        GRAD_IN: '#666',
        GRAD_MID: '#444',
        GRAD_OUT: '#333',
        OUTLINE: '#444'
    },
    BACKGROUND: {
        BOTTOM: '#444',
        MID: '#222',
        TOP: '#000'
    },
    BULLET: {
        GRAD_BOTTOM: '#ff4444',
        GRAD_MID: '#ff8e8e',
        GRAD_TOP: '#ff6b6b',
        SHADOW: '#ff6b6b',
        TRAIL: 'rgba(255, 107, 107, 0.5)'
    },
    ENGINE: {
        GLOW1: 'rgba(255, 100, 100, 0.8)',
        GLOW2: 'rgba(255, 150, 100, 0.4)',
        GLOW3: 'rgba(255, 200, 100, 0)'
    },
    EXPLOSION: {
        GRAD_IN: 'rgba(255, 255, 255, ', // alpha appended
        GRAD_MID1: 'rgba(255, 200, 100, ', // alpha appended
        GRAD_MID2: 'rgba(255, 100, 50, ', // alpha appended
        GRAD_OUT: 'rgba(255, 50, 0, 0)'
    },
    NEBULA: {
        N1: 'rgba(80, 130, 255, 0.1)',
        N1_OUT: 'rgba(80, 130, 255, 0)',
        N2: 'rgba(255, 100, 100, 0.1)',
        N2_OUT: 'rgba(255, 100, 100, 0)',
        N3: 'rgba(255, 200, 100, 0.1)',
        N3_OUT: 'rgba(255, 200, 100, 0)',
        N4: 'rgba(180, 80, 255, 0.1)',
        N4_OUT: 'rgba(180, 80, 255, 0)'
    },
    PLAYER: {
        COCKPIT: '#b20000',
        GRAD_BOTTOM: '#fff',
        GRAD_MID: '#ddd',
        GRAD_TOP: '#000',
        GUN: '#b20000',
        OUTLINE: '#bbb',
        SHADOW: '#000'
    },
    STAR: {
        BASE: '#ffd700',
        GRAD_IN: '#ffffff',
        GRAD_MID: '#ffd700',
        GRAD_OUT: '#ffa500'
    },
    UI: {
        OVERLAY_BACKDROP: 'rgba(0,0,0,0.5)',
        OVERLAY_TEXT: '#fff'
    }
});

export const CONFIG = deepFreeze({
    ASTEROID: {
        HORIZONTAL_MARGIN: 40,
        MIN_SIZE: 25,
        SIZE_VARIATION: 50,
        SPAWN_Y: -40,
        SPEED_VARIATION: 120
    },
    BULLET: {
        HEIGHT: 15,
        SPAWN_OFFSET: -2,
        TRAIL: 10,
        WIDTH: 4
    },
    COLORS: COLORS,
    EXPLOSION: {
        LIFE: 0.25,
        OFFSET: 25,
        PARTICLE_COUNT: 15,
        PARTICLE_LIFE: 0.5,
        PARTICLE_SIZE_MIN: 2,
        PARTICLE_SIZE_VARIATION: 4,
        SIZE: 50
    },
    PARTICLE: {
        GRAVITY: 360
    },
    ENGINE_TRAIL: {
        SPEED: 120,
        LIFE: 0.33,
        SPAWN_JITTER: 4,
        SIZE_MIN: 1,
        SIZE_MAX: 3
    },
    GAME: {
        ASTEROID_SCORE: 10,
        ASTEROID_SPAWN_RATE: 1.2,
        SHOT_COOLDOWN: 200,
        STARFIELD_COUNT: 150,
        STAR_SCORE: 20,
        STAR_SPAWN_RATE: 0.6
    },
    INPUT: {
        CONFIRM_CODES: ['Enter', 'Space'].sort(),
        FIRE_CODES: ['Space'].sort(),
        MOVEMENT_CODES: ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyS', 'KeyW'],
        PAUSE_CODES: ['Escape'],
        PAUSE_KEYS: ['Esc', 'Escape']
    },
    NEBULA: {
        COUNT_DESKTOP: 8,
        COUNT_MOBILE: 4,
        RADIUS_MAX_DESKTOP: 250,
        RADIUS_MAX_MOBILE: 125,
        RADIUS_MIN_DESKTOP: 100,
        RADIUS_MIN_MOBILE: 50
    },
    PLAYER: {
        SPAWN_Y_OFFSET: 100
    },
    SIZES: {
        PLAYER: 25
    },
    SPEEDS: {
        ASTEROID_DESKTOP: 180,
        ASTEROID_MOBILE: 120,
        BULLET: 480,
        PLAYER: 480,
        STAR: 60
    },
    STAR: {
        HORIZONTAL_MARGIN: 20,
        MIN_SIZE: 15,
        PARTICLE_BURST: 12,
        PARTICLE_LIFE: 0.33,
        PARTICLE_SIZE_MIN: 1,
        PARTICLE_SIZE_VARIATION: 2,
        PULSE: false,
        PULSE_AMPLITUDE: 0.2,
        PULSE_SPEED: 1,
        SIZE_VARIATION: 30,
        SPAWN_Y: -20
    },
    TIME: {
        DEFAULT_DT: 1/60
    },
    UI: {
        PAUSE_OVERLAY: {
            BACKDROP: COLORS.UI.OVERLAY_BACKDROP,
            FONT: 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            MESSAGE: 'Paused - Esc to resume',
            TEXT_ALIGN: 'center',
            TEXT_BASELINE: 'middle',
            TEXT_COLOR: COLORS.UI.OVERLAY_TEXT
        }
    }
});

/** Tau-like constant: 2π */
export const PI2 = Math.PI * 2;
/** Clamp a number between (min, max). */
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Deeply freezes an object to make it immutable at all nested levels.
 * Note: Only freezes plain objects/arrays; primitives are ignored by Object.freeze.
 * @param {any} obj
 * @returns {any} The same object, deeply frozen
 */
function deepFreeze(obj) {
    if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            const value = obj[prop];
            if (value && typeof value === 'object') {
                deepFreeze(value);
            }
        });
        Object.freeze(obj);
    }
    return obj;
}
