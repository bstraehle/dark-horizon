/**
 * Finite state machine for high-level game flow.
 * States: 'menu' | 'running' | 'paused' | 'gameover'
 */
export class GameStateMachine {
  constructor() {
    /** @type {'menu' | 'running' | 'paused' | 'gameover'} */
    this.state = "menu";
  }

  /** @returns {boolean} */ isRunning() {
    return this.state === "running";
  }
  /** @returns {boolean} */ isPaused() {
    return this.state === "paused";
  }
  /** @returns {boolean} */ isMenu() {
    return this.state === "menu";
  }
  /** @returns {boolean} */ isGameOver() {
    return this.state === "gameover";
  }

  /** Transition to running from menu/gameover. */
  start() {
    if (this.state === "menu" || this.state === "gameover" || this.state === "paused") {
      this.state = "running";
    }
  }

  /** Transition to paused from running. */
  pause() {
    if (this.state === "running") this.state = "paused";
  }

  /** Transition to running from paused. */
  resume() {
    if (this.state === "paused") this.state = "running";
  }

  /** Transition to gameover from running/paused. */
  end() {
    if (this.state === "running" || this.state === "paused") this.state = "gameover";
  }
}
