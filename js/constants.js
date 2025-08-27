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
    // More realistic rocky asteroid tones: dusty light center, mid gray-brown, dark outer rim
    CRATER: "#6b6b6b", // crater - cool gray
    GRAD_IN: "#cfc9c0", // dusty, slightly warm center
    GRAD_MID: "#8f8579", // stony gray-brown midtone
    GRAD_OUT: "#3f3a36", // dark outer rim
    OUTLINE: "#2f2b28", // deep outline for contrast
    RING: "#7a7570", // subtle ring tone matching mid/crater
  },
  // Hard/indestructible asteroid variant (darker, higher contrast outline)
  ASTEROID_HARD: {
    CRATER: "#333",
    GRAD_IN: "#333",
    GRAD_MID: "#222",
    GRAD_OUT: "#111",
    OUTLINE: "#777",
    RING: "#999",
    SHIELD: "#4da3ff",
  },
  // Slightly darker than regular asteroid, used when shielded to keep core natural
  ASTEROID_DARK: {
    // Mars-like palette: rusty orange and brown tones
    CRATER: "#6B3926", // dark brown (crater)
    GRAD_IN: "#FF8C42", // bright rusty orange (center)
    GRAD_MID: "#C1440E", // burnt orange / Mars red
    GRAD_OUT: "#3C1A0E", // deep brown (outer)
    OUTLINE: "#8B3E2F", // muted reddish-brown outline
    SHIELD: "#FFBF8A", // warm orange glow for impacts
    RING: "#6B3926", // match crater color for unified look
  },
  BACKGROUND: {
    BOTTOM: "#444",
    MID: "#222",
    TOP: "#000",
  },
  BULLET: {
    GRAD_BOTTOM: "#ff4444",
    GRAD_MID: "#ff8e8e",
    GRAD_TOP: "#ff6b6b",
    SHADOW: "#ff6b6b",
    TRAIL: "rgba(255, 107, 107, 0.5)",
  },
  ENGINE: {
    GLOW1: "rgba(255, 100, 100, 0.8)",
    GLOW2: "rgba(255, 150, 100, 0.4)",
    GLOW3: "rgba(255, 200, 100, 0)",
  },
  EXPLOSION: {
    GRAD_IN: "rgba(255, 255, 255, ", // alpha appended
    GRAD_MID1: "rgba(255, 200, 100, ", // alpha appended
    GRAD_MID2: "rgba(255, 100, 50, ", // alpha appended
    GRAD_OUT: "rgba(255, 50, 0, 0)",
  },
  NEBULA: {
    N1: "rgba(80, 130, 255, 0.1)",
    N1_OUT: "rgba(80, 130, 255, 0)",
    N2: "rgba(255, 100, 100, 0.1)",
    N2_OUT: "rgba(255, 100, 100, 0)",
    N3: "rgba(255, 200, 100, 0.1)",
    N3_OUT: "rgba(255, 200, 100, 0)",
    N4: "rgba(180, 80, 255, 0.1)",
    N4_OUT: "rgba(180, 80, 255, 0)",
  },
  PLAYER: {
    COCKPIT: "#b20000",
    GRAD_BOTTOM: "#fff",
    GRAD_MID: "#ddd",
    GRAD_TOP: "#000",
    GUN: "#b20000",
    OUTLINE: "#bbb",
    SHADOW: "#000",
  },
  STAR: {
    BASE: "#ffd700",
    GRAD_IN: "#ffffff",
    GRAD_MID: "#ffd700",
    GRAD_OUT: "#ffa500",
  },
  // Red bonus star palette
  STAR_RED: {
    // Match the STAR shading (white inner, bright base/mid, darker outer) but in red
    BASE: "#ff3333", // bright red base (analogous to #ffd700 for yellow)
    GRAD_IN: "#ffffff", // white inner glow (same as regular stars)
    GRAD_MID: "#ff3333", // mid tone matches base for strong glow
    GRAD_OUT: "#b20000", // deep red for outer edge
  },
  UI: {
    OVERLAY_BACKDROP: "rgba(0,0,0,0.5)",
    OVERLAY_TEXT: "#fff",
  },
});

export const CONFIG = deepFreeze({
  TWO_PI: Math.PI * 2,
  VIEW: {
    DPR_MIN: 1,
    DPR_MAX: 3,
  },
  ASTEROID: {
    HORIZONTAL_MARGIN: 40,
    MIN_SIZE: 25,
    SIZE_VARIATION: 50,
    SPAWN_Y: -40,
    SPEED_VARIATION: 120,
    SHIELD_FLASH_TIME: 0.15,
    SHIELD_FLASH_EXTRA_ALPHA: 0.4,
  },
  BULLET: {
    HEIGHT: 15,
    SPAWN_OFFSET: -2,
    TRAIL: 10,
    WIDTH: 4,
    SHADOW_BLUR: 8,
  },
  COLORS: COLORS,
  EXPLOSION: {
    LIFE: 0.25,
    OFFSET: 25,
    PARTICLE_COUNT: 15,
    PARTICLE_LIFE: 0.5,
    PARTICLE_SPEED_VAR: 480,
    PARTICLE_SIZE_MIN: 2,
    PARTICLE_SIZE_VARIATION: 4,
    SIZE: 50,
    SCALE_GAIN: 2,
  },
  PARTICLE: {
    GRAVITY: 360,
  },
  ENGINE_TRAIL: {
    SPEED: 120,
    LIFE: 0.33,
    SPAWN_JITTER: 4,
    SIZE_MIN: 1,
    SIZE_MAX: 3,
    DRAW_SIZE_MULT: 2,
  },
  GAME: {
    ASTEROID_SCORE: 10,
    ASTEROID_SPAWN_RATE: 2.0,
    SHOT_COOLDOWN: 200,
    STARFIELD_COUNT: 150,
    STAR_SCORE: 20,
    STAR_SCORE_RED: 50,
    STAR_SPAWN_RATE: 1.0,
    // How many yellow stars are spawned before a red bonus star appears.
    // Original behavior used 10 (so the 11th was red). Lower this to increase red star frequency.
    STAR_YELLOW_BEFORE_RED: 4,
    // How many normal asteroids are spawned before an indestructible one appears.
    // Original behavior used 10 (so the 11th was indestructible). Lower this to increase frequency.
    ASTEROID_NORMAL_BEFORE_INDESTRUCTIBLE: 4,
  },
  INPUT: {
    CONFIRM_CODES: ["Enter"].sort(),
    FIRE_CODES: ["Space"].sort(),
    MOVEMENT_CODES: [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "KeyA",
      "KeyD",
      "KeyS",
      "KeyW",
    ],
    PAUSE_CODES: ["Escape"],
    PAUSE_KEYS: ["Esc", "Escape"],
  },
  RNG: {
    SEED_PARAM: "seed",
  },
  NEBULA: {
    COUNT_DESKTOP: 8,
    COUNT_MOBILE: 4,
    RADIUS_MAX_DESKTOP: 250,
    RADIUS_MAX_MOBILE: 125,
    RADIUS_MIN_DESKTOP: 100,
    RADIUS_MIN_MOBILE: 50,
    BLOB_COUNT_BASE_DESKTOP: 5,
    BLOB_COUNT_VAR_DESKTOP: 3,
    BLOB_COUNT_BASE_MOBILE: 3,
    BLOB_COUNT_VAR_MOBILE: 2,
    BLOB_MIN_FACTOR: 0.35,
    BLOB_VAR_FACTOR: 0.6,
    WOBBLE_AMP_MIN: 4,
    WOBBLE_AMP_VAR: 8,
    WOBBLE_RATE_BASE: 0.002,
    WOBBLE_RATE_VAR: 0.004,
    WOBBLE_RATE_SCALE: 60,
    SPEED_JITTER: 0.4,
    SPEED_SCALE: 60,
    RADIUS_RATE_JITTER: 0.15,
    RADIUS_RATE_SCALE: 60,
  },
  PLAYER: {
    SPAWN_Y_OFFSET: 100,
    MOUSE_LERP: 6,
    DRAW: {
      OUTLINE_WIDTH: 2.5,
      COCKPIT_RX: 4,
      COCKPIT_RY: 3,
      GUN_WIDTH: 4,
      GUN_HEIGHT: 10,
      GUN_OFFSET_Y: -8,
    },
  },
  SIZES: {
    PLAYER: 25,
  },
  SPEEDS: {
    ASTEROID_DESKTOP: 200,
    ASTEROID_MOBILE: 150,
    BULLET: 480,
    PLAYER: 480,
    STAR: 100,
  },
  STARFIELD: {
    SIZE_MIN: 0.5,
    SIZE_VAR: 2,
    SPEED_MIN: 6,
    SPEED_VAR: 30,
    BRIGHTNESS_MIN: 0.5,
    BRIGHTNESS_VAR: 0.5,
    RESET_Y: -5,
    TWINKLE_RATE: 4, // radians per second
    TWINKLE_X_FACTOR: 0.01,
    SHADOW_BLUR_MULT: 2,
  },
  STAR: {
    HORIZONTAL_MARGIN: 20,
    MIN_SIZE: 15,
    SHADOW_BLUR: 15,
    // Variation in spawned star speed (used as rng.range(0, SPEED_VARIATION))
    SPEED_VARIATION: 30,
    PARTICLE_BURST: 12,
    PARTICLE_LIFE: 0.33,
    PARTICLE_SIZE_MIN: 1,
    PARTICLE_SIZE_VARIATION: 2,
    PARTICLE_BURST_SPEED_MIN: 120,
    PARTICLE_BURST_SPEED_VAR: 180,
    PULSE: false,
    PULSE_AMPLITUDE: 0.2,
    PULSE_SPEED: 1,
    SIZE_VARIATION: 30,
    SPAWN_Y: -20,
  },
  TIME: {
    DEFAULT_DT: 1 / 60,
    STEP_MS: 1000 / 60,
    MAX_SUB_STEPS: 5,
  },
  UI: {
    PAUSE_OVERLAY: {
      BACKDROP: COLORS.UI.OVERLAY_BACKDROP,
      FONT: "bold 28px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      MESSAGE: "Paused - Esc to resume",
      TEXT_ALIGN: "center",
      TEXT_BASELINE: "middle",
      TEXT_COLOR: COLORS.UI.OVERLAY_TEXT,
    },
  },
});

/** Tau-like constant: 2π */
export const PI2 = Math.PI * 2;
/** Clamp a number between (min, max). */
/**
 * Clamp a number between (min, max).
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Deeply freezes an object to make it immutable at all nested levels.
 * Note: Only freezes plain objects/arrays; primitives are ignored by Object.freeze.
 * @param {any} obj
 * @returns {any} The same object, deeply frozen
 */
function deepFreeze(obj) {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = obj[prop];
      if (value && typeof value === "object") {
        deepFreeze(value);
      }
    });
    Object.freeze(obj);
  }
  return obj;
}
