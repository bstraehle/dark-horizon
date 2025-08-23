/**
 * UIManager centralizes DOM updates and focus management for overlays and scores.
 */
export class UIManager {
  /** Load high score from localStorage safely. */
  static loadHighScore() {
    try {
      return Number(localStorage.getItem("darkHorizonHighScore")) || 0;
    } catch (_) {
      return 0;
    }
  }

  /** Set the current score element.
   * @param {HTMLElement|null} currentScoreEl
   * @param {number|string} score
   */
  static setScore(currentScoreEl, score) {
    if (currentScoreEl) currentScoreEl.textContent = String(score);
  }

  /** Set and persist high score; returns the new high score.
   * @param {number} score
   * @param {number} [prevHigh]
   * @param {HTMLElement|null} [highScoreEl]
   * @returns {number}
   */
  static setHighScore(score, prevHigh, highScoreEl) {
    let high = prevHigh || 0;
    if (score > high) {
      high = score;
      try {
        localStorage.setItem("darkHorizonHighScore", String(high));
      } catch (_) {
        // ignore
      }
    }
    if (highScoreEl) highScoreEl.textContent = String(high);
    return high;
  }

  /** Show game over overlay and focus restart button.
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   * @param {HTMLElement|null} finalScoreEl
   * @param {number} score
   */
  static showGameOver(gameOverScreen, restartBtn, finalScoreEl, score) {
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (gameOverScreen) gameOverScreen.classList.remove("hidden");
    UIManager.focusWithRetry(restartBtn);
  }

  /** Hide game over overlay.
   * @param {HTMLElement|null} gameOverScreen
   */
  static hideGameOver(gameOverScreen) {
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
  }

  /** Hide start/info overlay.
   * @param {HTMLElement|null} gameInfo
   */
  static hideGameInfo(gameInfo) {
    if (gameInfo) gameInfo.classList.add("hidden");
  }

  /** Try focusing an element reliably (helps on mobile).
   * @param {HTMLElement|null} el
   */
  static focusWithRetry(el) {
    if (!el) return;
    const tryFocus = () => {
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    };
    tryFocus();
    if (document.activeElement !== el) {
      requestAnimationFrame(() => {
        tryFocus();
        if (document.activeElement !== el) {
          setTimeout(() => {
            tryFocus();
          }, 250);
        }
      });
    }
  }

  /** Ensure appropriate overlay button is focused based on visibility.
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static ensureOverlayFocus(gameInfo, startBtn, gameOverScreen, restartBtn) {
    if (gameOverScreen && !gameOverScreen.classList.contains("hidden")) {
      UIManager.focusWithRetry(restartBtn);
      return;
    }
    if (gameInfo && !gameInfo.classList.contains("hidden")) {
      UIManager.focusWithRetry(startBtn);
      return;
    }
  }

  /** Window focus/pageshow handler to restore overlay focus.
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static handleWindowFocus(gameInfo, startBtn, gameOverScreen, restartBtn) {
    UIManager.ensureOverlayFocus(gameInfo, startBtn, gameOverScreen, restartBtn);
  }

  /** Document visibility handler to restore overlay focus when visible.
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static handleVisibilityChange(gameInfo, startBtn, gameOverScreen, restartBtn) {
    if (!document.hidden) {
      UIManager.ensureOverlayFocus(gameInfo, startBtn, gameOverScreen, restartBtn);
    }
  }

  /** Focus guard while Start overlay is visible.
   * @param {Event} e
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   */
  static handleStartScreenFocusGuard(e, gameInfo, startBtn) {
    if (!gameInfo || gameInfo.classList.contains("hidden")) return;
    const t = /** @type {Element|null} */ (e && e.target instanceof Element ? e.target : null);
    const targetIsStart =
      t === startBtn || (t && "closest" in t && t.closest && t.closest("#startBtn"));
    if (!targetIsStart) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    UIManager.focusWithRetry(startBtn);
  }

  /** Focus guard while Game Over overlay is visible.
   * @param {Event} e
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static handleGameOverFocusGuard(e, gameOverScreen, restartBtn) {
    if (!gameOverScreen || gameOverScreen.classList.contains("hidden")) return;
    const t = /** @type {Element|null} */ (e && e.target instanceof Element ? e.target : null);
    const targetIsRestart =
      t === restartBtn || (t && "closest" in t && t.closest && t.closest("#restartBtn"));
    if (!targetIsRestart) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    UIManager.focusWithRetry(restartBtn);
  }
}
