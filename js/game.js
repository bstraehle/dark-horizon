/**
 * DarkHorizon game logic.
 *
 * This file implements the Dark Horizon game, a browser-based arcade shooter.
 * The player controls a ship, collects stars, and shoots asteroids for points.
 */

import { CONFIG } from "./constants.js";

// Core
import { GameLoop } from "./core/GameLoop.js";
import { getGameContext } from "./core/GameContext.js";
import { InputState } from "./core/InputState.js";

// Entities
import { Asteroid } from "./entities/Asteroid.js";
import { Bullet } from "./entities/Bullet.js";
import { EngineTrail } from "./entities/EngineTrail.js";
import { Explosion } from "./entities/Explosion.js";
import { Nebula } from "./entities/Nebula.js";
import { Particle } from "./entities/Particle.js";
import { Player } from "./entities/Player.js";
import { Star } from "./entities/Star.js";

// Managers
import { BackgroundManager } from "./managers/BackgroundManager.js";
import { CollisionManager } from "./managers/CollisionManager.js";
import { InputManager } from "./managers/InputManager.js";
import { RenderManager } from "./managers/RenderManager.js";
import { SpawnManager } from "./managers/SpawnManager.js";
import { SpriteManager } from "./managers/SpriteManager.js";
import { UIManager } from "./managers/UIManager.js";
import { ViewManager } from "./managers/ViewManager.js";

// Utils
import { ObjectPool } from "./utils/ObjectPool.js";
import { RateLimiter } from "./utils/RateLimiter.js";
import { RNG } from "./utils/RNG.js";
import {
  updateAsteroids,
  updateBullets,
  updateEngineTrail,
  updateExplosions,
  updateParticles,
  updateStars,
} from "./systems/UpdateSystems.js";
import { EventBus } from "./core/EventBus.js";
import { GameStateMachine } from "./core/GameStateMachine.js";
import { EventHandlers } from "./systems/EventHandlers.js";
/** @typedef {import('./types.js').GameState} GameState */

/**
 * Main game class for DarkHorizon.
 * Handles game state, rendering, input, and logic for the arcade shooter.
 */
/** @implements {Partial<GameState>} */
class DarkHorizon {
  /**
   * Initialize game state and UI elements.
   * Sets up UI, game variables, and event listeners.
   */
  constructor() {
    /** @type {HTMLCanvasElement} */
    // @ts-ignore - cast from HTMLElement
    this.canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("gameCanvas"));
    /** @type {CanvasRenderingContext2D} */
    // @ts-ignore - context inferred via cast
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext("2d", { alpha: false })
    );
    this.view = { width: 0, height: 0, dpr: 1 };
    this.gameInfo = /** @type {HTMLElement} */ (document.getElementById("gameInfo"));
    this.gameOverScreen = /** @type {HTMLElement} */ (document.getElementById("gameOverScreen"));
    this.startBtn = /** @type {HTMLButtonElement} */ (document.getElementById("startBtn"));
    this.restartBtn = /** @type {HTMLButtonElement} */ (document.getElementById("restartBtn"));
    this.currentScoreEl = /** @type {HTMLElement} */ (document.getElementById("currentScore"));
    this.highScoreEl = /** @type {HTMLElement} */ (document.getElementById("highScore"));
    this.finalScoreEl = /** @type {HTMLElement} */ (document.getElementById("finalScore"));

    this.highScore = UIManager.loadHighScore();
    this.score = 0;
    this.updateHighScore();

    this.input = new InputState();
    this.events = new EventBus();

    this._isMobile = this.isMobile();

    this.asteroidSpeed = this._isMobile
      ? CONFIG.SPEEDS.ASTEROID_MOBILE
      : CONFIG.SPEEDS.ASTEROID_DESKTOP;
    this.bulletSpeed = CONFIG.SPEEDS.BULLET;
    this.starSpeed = CONFIG.SPEEDS.STAR;

    // Initialize RNG with optional seed from URL (?seed=...) for reproducible runs
    let seed = undefined;
    try {
      const url = new URL(window.location.href);
      const s = url.searchParams.get(CONFIG.RNG.SEED_PARAM);
      if (s && s.length) {
        const n = Number(s);
        seed = Number.isFinite(n) ? n : undefined;
        if (seed === undefined) {
          // Fallback to string hashing for non-numeric seeds
          this.rng = RNG.fromString(s);
        }
      }
    } catch {
      // non-browser envs (tests) may lack URL; ignore
    }
    this.rng = this.rng || new RNG(seed);
    this.fireLimiter = new RateLimiter(CONFIG.GAME.SHOT_COOLDOWN, () => this.timeMs);

    // State machine controls high-level flow
    this.state = new GameStateMachine();
    this._pausedFrameRendered = false;

    this.fireLimiter.reset();
    this.timeMs = 0;
    this.timeSec = 0;

    this.player = new Player(0, 0, CONFIG.SIZES.PLAYER, CONFIG.SIZES.PLAYER, CONFIG.SPEEDS.PLAYER);

    this.engineTrail = new EngineTrail();

    this.resizeCanvas();
    this.initBackground();
    this.drawBackground();

    this.sprites = SpriteManager.createSprites();
    this.cellSize = CONFIG.ASTEROID.MIN_SIZE + CONFIG.ASTEROID.SIZE_VARIATION;

    this.asteroids = [];
    this.bullets = [];
    this.explosions = [];
    this.particles = [];
    this.stars = [];
    /** Track consecutive yellow stars spawned to insert red bonus ones */
    this._yellowStarCount = 0;
    /** Track normals to insert an indestructible asteroid after 10 normals */
    this._normalAsteroidCount = 0;

    this.bulletPool = new ObjectPool(
      (x, y, w, h, speed) => new Bullet(x, y, w, h, speed),
      undefined,
      { maxSize: 512 }
    );
    this.particlePool = new ObjectPool(
      (x, y, vx, vy, life, maxLife, size, color) =>
        new Particle(x, y, vx, vy, life, maxLife, size, color),
      undefined,
      { maxSize: 4096 }
    );
    this.asteroidPool = new ObjectPool(
      (x, y, w, h, speed, rng, isIndestructible = false) =>
        new Asteroid(x, y, w, h, speed, rng, isIndestructible),
      undefined,
      { maxSize: 256 }
    );
    this.starPool = new ObjectPool((x, y, w, h, speed) => new Star(x, y, w, h, speed), undefined, {
      maxSize: 256,
    });
    this.explosionPool = new ObjectPool(
      (x, y, w, h, life, maxLife) => new Explosion(x, y, w, h, life, maxLife),
      undefined,
      { maxSize: 256 }
    );

    // Pre-allocate common objects to reduce first-use jank
    this._warmUpPools();

    this.bindEventHandlers();
    this.setupEventListeners();
    // Register EventBus handlers centrally
    this._unsubscribeEvents = EventHandlers.register(this);

    this.startBtn.focus();

    this.loop = new GameLoop({
      update: (dtMs, dtSec) => {
        this.timeMs += dtMs;
        this.timeSec += dtSec;
        this._lastDtSec = dtSec;
        this.update(dtSec);
      },
      draw: () => this.draw(),
      shouldUpdate: () => this.state.isRunning(),
      stepMs: CONFIG.TIME.STEP_MS,
      maxSubSteps: CONFIG.TIME.MAX_SUB_STEPS,
    });
  }

  /** no-op placeholder to hint presence; handlers are registered in systems/EventHandlers */
  _unsubscribeEvents = null;

  /**
   * Detect if the user is on a mobile device.
   * @returns {boolean} True if mobile device detected, else false.
   */
  isMobile() {
    // Prefer User-Agent Client Hints when available
    // Access UA Client Hints via loose cast to support older lib.dom typings
    const uaData = /** @type {any} */ (navigator).userAgentData;
    if (uaData && typeof uaData.mobile === "boolean") {
      return uaData.mobile;
    }

    // Feature/media-query based detection
    const hasTouch = (navigator.maxTouchPoints || 0) > 0;
    const supportsMQ = typeof window.matchMedia === "function";
    const coarse = supportsMQ && window.matchMedia("(any-pointer: coarse)").matches;
    const noHover = supportsMQ && window.matchMedia("(any-hover: none)").matches;
    if (hasTouch && (coarse || noHover)) return true;

    // Last-resort fallback (legacy browsers)
    return /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Bind all event handler methods to the current instance.
   */
  bindEventHandlers() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleStartClick = this.handleStartClick.bind(this);
    this.handleRestartClick = this.handleRestartClick.bind(this);
    this.handleStartKeyDown = this.handleStartKeyDown.bind(this);
    this.handleRestartKeyDown = this.handleRestartKeyDown.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleStartScreenFocusGuard = this.handleStartScreenFocusGuard.bind(this);
    this.handleGameOverFocusGuard = this.handleGameOverFocusGuard.bind(this);
    this.ensureOverlayFocus = this.ensureOverlayFocus.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handlePauseKeyDown = this.handlePauseKeyDown.bind(this);
    this.shouldTogglePause = this.shouldTogglePause.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.shoot = this.shoot.bind(this);
    this.movementKeys = new Set(CONFIG.INPUT.MOVEMENT_CODES);
  }

  /**
   * Set up keyboard, mouse, touch, and button event listeners.
   */
  setupEventListeners() {
    InputManager.setup(
      this.canvas,
      this.gameInfo,
      this.gameOverScreen,
      this.startBtn,
      this.restartBtn,
      {
        handleKeyDown: this.handleKeyDown,
        handleKeyUp: this.handleKeyUp,
        handleResize: this.handleResize,
        handleMouseMove: this.handleMouseMove,
        handleMouseDown: this.handleMouseDown,
        handleMouseUp: this.handleMouseUp,
        handleMouseLeave: this.handleMouseLeave,
        handleTouchMove: this.handleTouchMove,
        handleTouchStart: this.handleTouchStart,
        handleTouchEnd: this.handleTouchEnd,
        handleStartClick: this.handleStartClick,
        handleRestartClick: this.handleRestartClick,
        handleStartKeyDown: this.handleStartKeyDown,
        handleRestartKeyDown: this.handleRestartKeyDown,
        handleStartScreenFocusGuard: this.handleStartScreenFocusGuard,
        handleGameOverFocusGuard: this.handleGameOverFocusGuard,
        handleWindowFocus: this.handleWindowFocus,
        handleVisibilityChange: this.handleVisibilityChange,
        handleScroll: this.handleScroll,
        handlePauseKeyDown: this.handlePauseKeyDown,
      }
    );
  }

  /**
   * Global keydown handler for pause/resume toggling.
   */
  handlePauseKeyDown(e) {
    if (this.shouldTogglePause(e)) {
      e.preventDefault();
      this.togglePause();
    }
  }

  /**
   * Determine if the pause state should toggle based on the event and current game state.
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  shouldTogglePause(e) {
    if (!this.state.isRunning() && !this.state.isPaused()) return false;
    if (e.repeat) return false;
    const isPauseKey =
      CONFIG.INPUT.PAUSE_CODES.includes(e.code) || CONFIG.INPUT.PAUSE_KEYS.includes(e.key);
    const isConfirmWhilePaused =
      this.state.isPaused() && CONFIG.INPUT.CONFIRM_CODES.includes(e.code);
    return isPauseKey || isConfirmWhilePaused;
  }

  /**
   * Keep focus on the start button when the Start overlay is visible.
   * Prevents taps/clicks from removing focus on mobile.
   * @param {Event} e
   */
  handleStartScreenFocusGuard(e) {
    UIManager.handleStartScreenFocusGuard(e, this.gameInfo, this.startBtn);
  }

  /**
   * Keep focus on the restart button when the Game Over overlay is visible.
   * Prevents taps/clicks from removing focus on mobile.
   * @param {Event} e
   */
  handleGameOverFocusGuard(e) {
    UIManager.handleGameOverFocusGuard(e, this.gameOverScreen, this.restartBtn);
  }

  /**
   * Ensure the correct overlay button is focused if an overlay is visible.
   * Useful when the user switches tabs/apps and returns.
   */
  ensureOverlayFocus() {
    UIManager.ensureOverlayFocus(
      this.gameInfo,
      this.startBtn,
      this.gameOverScreen,
      this.restartBtn
    );
  }

  /**
   * When window/tab gains focus (or pageshow fires), restore overlay focus.
   */
  handleWindowFocus() {
    UIManager.handleWindowFocus(this.gameInfo, this.startBtn, this.gameOverScreen, this.restartBtn);
  }

  /**
   * When document becomes visible again, restore overlay focus.
   */
  handleVisibilityChange() {
    UIManager.handleVisibilityChange(
      this.gameInfo,
      this.startBtn,
      this.gameOverScreen,
      this.restartBtn
    );
  }

  /**
   * Update cached canvas bounding rect (used for touch offset calculations).
   */
  handleScroll() {
    this.canvasRect = this.canvas.getBoundingClientRect();
  }

  /**
   * Ensure a given element receives focus reliably (helps on mobile Safari/Chrome).
   * @param {HTMLElement} el
   */
  focusWithRetry(el) {
    UIManager.focusWithRetry(el);
  }

  /**
   * Handle keydown events.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleKeyDown(e) {
    if (document.activeElement === this.startBtn || document.activeElement === this.restartBtn)
      return;
    this.input.setKey(e.code, true);
    if (CONFIG.INPUT.FIRE_CODES.includes(e.code)) {
      if (!e.repeat) {
        e.preventDefault();
        this.input.fireHeld = true;
        this.shoot();
      }
      return;
    }
    if (this.movementKeys.has(e.code)) {
      this.input.clearMouse();
    }
  }

  /**
   * Handle keyup events.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleKeyUp(e) {
    this.input.setKey(e.code, false);
    if (CONFIG.INPUT.FIRE_CODES.includes(e.code)) {
      this.input.fireHeld = false;
    }
  }

  /**
   * Track mouse position.
   * @param {MouseEvent} e - The mouse event.
   */
  handleMouseMove(e) {
    this.input.mouse.x = e.offsetX;
    this.input.mouse.y = e.offsetY;
  }

  /** Mouse down -> start continuous fire and fire immediately. */
  handleMouseDown() {
    if (!this.state.isRunning()) return;
    this.input.fireHeld = true;
    this.shoot();
  }

  /** Mouse up -> stop continuous fire. */
  handleMouseUp() {
    this.input.fireHeld = false;
  }

  /** Mouse leaves canvas -> stop continuous fire. */
  handleMouseLeave() {
    this.input.fireHeld = false;
  }

  /**
   * Track touch position (mobile).
   * @param {TouchEvent} e - The touch event.
   */
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.canvasRect) this.canvasRect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.input.mouse.x = touch.clientX - this.canvasRect.left;
    this.input.mouse.y = touch.clientY - this.canvasRect.top;
  }

  /**
   * Handle touch start event (mobile).
   * @param {TouchEvent} e - The touch event.
   */
  handleTouchStart(e) {
    e.preventDefault();
    if (!this.state.isRunning()) return;
    this.input.fireHeld = true;
    this.shoot();
  }

  /** End touch (lift/cancel) -> stop continuous fire. */
  handleTouchEnd(e) {
    if (e && e.cancelable) e.preventDefault();
    this.input.fireHeld = false;
  }

  /**
   * Start the game when start button is clicked.
   */
  handleStartClick() {
    this.startGame();
    this.startBtn.focus();
  }

  /**
   * Restart the game when restart button is clicked.
   */
  handleRestartClick() {
    this.hideGameOver();
    this.startGame();
    this.startBtn.focus();
  }

  /**
   * Keyboard accessibility for start button.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleStartKeyDown(e) {
    if (CONFIG.INPUT.CONFIRM_CODES.includes(e.code)) {
      e.preventDefault();
      this.startGame();
      this.startBtn.focus();
    }
  }

  /**
   * Keyboard accessibility for restart button.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleRestartKeyDown(e) {
    if (CONFIG.INPUT.CONFIRM_CODES.includes(e.code)) {
      e.preventDefault();
      this.hideGameOver();
      this.startGame();
      this.startBtn.focus();
    }
  }

  /**
   * Fire a bullet if cooldown allows.
   */
  shoot() {
    if (!this.state.isRunning()) return;
    this.fireLimiter.try(() => {
      this.bullets.push(this.createBullet());
    });
  }

  /**
   * Resize the game canvas and reposition the player.
   */
  resizeCanvas() {
    ViewManager.resize(this);
  }

  /**
   * Debounced resize handler to avoid excessive work during window resizing.
   */
  handleResize() {
    if (this._resizeScheduled) return;
    this._resizeScheduled = true;
    requestAnimationFrame(() => {
      this._resizeScheduled = false;
      this.resizeCanvas();
      this.initBackground();
      if (this.state.isPaused()) this._pausedFrameRendered = false;
      if (!this.state.isRunning()) {
        this.drawBackground();
      }
    });
  }

  /**
   * Start or restart the game, reset scores and state.
   */
  startGame() {
    this.state.start();
    this.resetGameState();
    this.hideGameInfo();
    this.initBackground();
    this.loop.start();
  }

  /**
   * Reset score and clear dynamic entity arrays.
   */
  resetGameState() {
    const releaseAll = (arr, pool) => {
      if (!arr || !pool) return;
      for (const it of arr) pool.release(it);
    };
    releaseAll(this.asteroids, this.asteroidPool);
    releaseAll(this.bullets, this.bulletPool);
    releaseAll(this.explosions, this.explosionPool);
    releaseAll(this.particles, this.particlePool);
    releaseAll(this.stars, this.starPool);
    this.score = 0;
    this.updateScore();
    this.asteroids = [];
    this.bullets = [];
    this.explosions = [];
    this.particles = [];
    this.stars = [];
    this.fireLimiter.reset();
    this.input.fireHeld = false;
    this._yellowStarCount = 0;
    this._normalAsteroidCount = 0;
  }

  /**
   * Toggle pause state.
   */
  togglePause() {
    if (this.state.isPaused()) this.state.resume();
    else if (this.state.isRunning()) this.state.pause();
    this._pausedFrameRendered = false;
  }

  /**
   * End the game.
   */
  gameOver() {
    this.state.end();
    this.updateHighScore();
    this.showGameOver();
    if (this.loop) this.loop.stop();
  }

  /**
   * Show the game over screen.
   */
  showGameOver() {
    UIManager.showGameOver(this.gameOverScreen, this.restartBtn, this.finalScoreEl, this.score);
  }

  /**
   * Hide the game over screen.
   */
  hideGameOver() {
    UIManager.hideGameOver(this.gameOverScreen);
  }

  /**
   * Hide the game info.
   */
  hideGameInfo() {
    UIManager.hideGameInfo(this.gameInfo);
  }

  /**
   * Update the displayed current score.
   */
  updateScore() {
    UIManager.setScore(this.currentScoreEl, this.score);
  }

  /**
   * Update and persist the high score if needed.
   */
  updateHighScore() {
    this.highScore = UIManager.setHighScore(this.score, this.highScore, this.highScoreEl);
  }

  /**
   * Update all game objects and check collisions.
   */
  update(dtSec = CONFIG.TIME.DEFAULT_DT) {
    if (this.nebulaConfigs) {
      Nebula.update(this.view.width, this.view.height, this.nebulaConfigs, this._isMobile, dtSec);
    }
    updateAsteroids(this, dtSec);
    updateBullets(this, dtSec);
    updateEngineTrail(this, dtSec);
    updateExplosions(this, dtSec);
    updateParticles(this, dtSec);
    updateStars(this, dtSec);
    if (this.input.fireHeld) {
      this.shoot();
    }
    this.spawnObjects(dtSec);
    this.checkCollisions();
    this.player.update(this.input.keys, this.input.mouse, this.view, dtSec);
  }

  /**
   * Randomly spawn asteroids and collectible stars.
   */
  spawnObjects(dtSec) {
    SpawnManager.spawnObjects(this, dtSec);
  }

  /**
   * Check for collisions between bullets, asteroids, player, and stars.
   */
  checkCollisions() {
    CollisionManager.check(this);
  }

  /**
   * Axis-aligned bounding box collision detection.
   * @param {{x: number, y: number, width: number, height: number}} rect1 - First rectangle.
   * @param {{x: number, y: number, width: number, height: number}} rect2 - Second rectangle.
   * @returns {boolean} True if collision detected, else false.
   */
  checkCollision(rect1, rect2) {
    return CollisionManager.intersects(rect1, rect2);
  }

  /**
   * Create a new asteroid object with random size and speed.
   * @returns {Asteroid} A new asteroid instance.
   */
  createAsteroid() {
    return SpawnManager.createAsteroid(this);
  }

  /**
   * Create a new bullet object at the player's position.
   * @returns {Bullet} A new bullet instance.
   */
  createBullet() {
    const bx =
      this.player.x + (this.player.width - CONFIG.BULLET.WIDTH) / 2 + CONFIG.BULLET.SPAWN_OFFSET;
    return this.bulletPool.acquire(
      bx,
      this.player.y,
      CONFIG.BULLET.WIDTH,
      CONFIG.BULLET.HEIGHT,
      this.bulletSpeed
    );
  }

  /**
   * Create explosion and particle effects at given position.
   * @param {number} x - X coordinate of explosion center.
   * @param {number} y - Y coordinate of explosion center.
   */
  createExplosion(x, y) {
    const rng = this.rng;
    for (let i = 0; i < CONFIG.EXPLOSION.PARTICLE_COUNT; i++) {
      const vx = (rng.nextFloat() - 0.5) * CONFIG.EXPLOSION.PARTICLE_SPEED_VAR;
      const vy = (rng.nextFloat() - 0.5) * CONFIG.EXPLOSION.PARTICLE_SPEED_VAR;
      const size =
        rng.range(0, CONFIG.EXPLOSION.PARTICLE_SIZE_VARIATION) + CONFIG.EXPLOSION.PARTICLE_SIZE_MIN;
      const gray = rng.range(40, 80);
      this.particles.push(
        this.particlePool.acquire(
          x,
          y,
          vx,
          vy,
          CONFIG.EXPLOSION.PARTICLE_LIFE,
          CONFIG.EXPLOSION.PARTICLE_LIFE,
          size,
          `hsl(0, 0%, ${gray}%)`
        )
      );
    }
    this.explosions.push(
      this.explosionPool.acquire(
        x - CONFIG.EXPLOSION.OFFSET,
        y - CONFIG.EXPLOSION.OFFSET,
        CONFIG.EXPLOSION.SIZE,
        CONFIG.EXPLOSION.SIZE,
        CONFIG.EXPLOSION.LIFE,
        CONFIG.EXPLOSION.LIFE
      )
    );
  }

  /**
   * Create a new collectible star object with random size and speed.
   * @returns {Star} A new star instance.
   */
  createStar() {
    return SpawnManager.createStar(this);
  }

  /**
   * Pre-allocate common pooled objects to reduce first-use jank.
   * Uses representative dimensions/speeds; objects remain in the free list until acquired.
   */
  _warmUpPools() {
    try {
      // Bullets
      this.bulletPool.warmUp(64, 0, 0, CONFIG.BULLET.WIDTH, CONFIG.BULLET.HEIGHT, this.bulletSpeed);

      // Asteroids
      const aW = CONFIG.ASTEROID.MIN_SIZE + CONFIG.ASTEROID.SIZE_VARIATION * 0.5;
      const aH = aW;
      this.asteroidPool.warmUp(
        32,
        0,
        CONFIG.ASTEROID.SPAWN_Y,
        aW,
        aH,
        this.asteroidSpeed,
        this.rng,
        false
      );

      // Stars
      const sSize = CONFIG.STAR.MIN_SIZE + CONFIG.STAR.SIZE_VARIATION * 0.5;
      this.starPool.warmUp(32, 0, CONFIG.STAR.SPAWN_Y, sSize, sSize, this.starSpeed, false);

      // Particles (explosion-like)
      this.particlePool.warmUp(
        256,
        0,
        0,
        0,
        0,
        CONFIG.EXPLOSION.PARTICLE_LIFE,
        CONFIG.EXPLOSION.PARTICLE_LIFE,
        2,
        "#999"
      );

      // Explosions
      this.explosionPool.warmUp(
        16,
        0,
        0,
        CONFIG.EXPLOSION.SIZE,
        CONFIG.EXPLOSION.SIZE,
        CONFIG.EXPLOSION.LIFE,
        CONFIG.EXPLOSION.LIFE
      );
    } catch (_) {
      // warm-up is best-effort; ignore in non-DOM or test envs
    }
  }

  /**
   * Draw all game objects and background for the current frame.
   */
  draw() {
    if (this.state.isPaused()) {
      if (!this._pausedFrameRendered) {
        this.drawFrame();
        this._pausedFrameRendered = true;
      }
      return;
    }

    this.drawFrame();
  }

  /**
   * Draw one full frame in the correct order.
   * Kept separate to avoid duplication between paused and running states.
   */
  drawFrame() {
    this.drawBackground();
    this.drawAsteroids();
    this.drawBullets();
    this.drawCollectibleStars();
    this.drawExplosions();
    this.drawParticles();
    this.player.draw(this.ctx);
    this.engineTrail.draw(this.ctx);
  }

  /**
   * Init the background.
   */
  initBackground() {
    const { nebulaConfigs, starField } = BackgroundManager.init(getGameContext(this));
    this.nebulaConfigs = nebulaConfigs;
    this.starField = starField;
  }

  /**
   * Draw the background.
   */
  drawBackground() {
    BackgroundManager.draw(getGameContext(this));
  }

  /**
   * Draw all asteroids with craters and outlines.
   */
  drawAsteroids() {
    RenderManager.drawAsteroids(this.ctx, this.asteroids);
  }

  /**
   * Draw all bullets and their trails.
   */
  drawBullets() {
    RenderManager.drawBullets(this.ctx, this.bullets, this.sprites);
  }

  /**
   * Draw collectible stars with pulsing and glow effects.
   */
  drawCollectibleStars() {
    RenderManager.drawCollectibleStars(this.ctx, this.stars, this.timeSec, this.sprites);
  }

  /**
   * Draw explosion effects with animated gradients.
   */
  drawExplosions() {
    RenderManager.drawExplosions(this.ctx, this.explosions);
  }

  /**
   * Draw all particles with fading and glow effects.
   */
  drawParticles() {
    RenderManager.drawParticles(this.ctx, this.particles);
  }
}

window.addEventListener("load", () => {
  new DarkHorizon();
});
