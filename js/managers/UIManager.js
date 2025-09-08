/**
 * UIManager centralizes DOM updates and focus management for overlays and scores.
 */
export class UIManager {
  // When true prefer scroll-preserving focus calls while overlays are visible.
  static _preserveFocus = false;
  /** Safe Element check for non-browser environments. */
  /**
   * Safe Element check for non-browser environments.
   * @param {unknown} obj
   * @returns {obj is Element}
   */
  static isElement(obj) {
    return typeof Element !== "undefined" && obj instanceof Element;
  }
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

  /**
   * Update visible countdown timer text.
   * @param {HTMLElement|null} timerEl
   * @param {number} secondsRemaining
   */
  static setTimer(timerEl, secondsRemaining) {
    if (!timerEl) return;
    // Format M:SS
    const s = Math.max(0, Math.floor(secondsRemaining));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
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

  /** Show pause overlay.
   * @param {HTMLElement|null} pauseScreen
   */
  static showPause(pauseScreen) {
    if (pauseScreen) pauseScreen.classList.remove("hidden");
  }

  /** Hide pause overlay.
   * @param {HTMLElement|null} pauseScreen
   */
  static hidePause(pauseScreen) {
    if (pauseScreen) pauseScreen.classList.add("hidden");
  }

  /** Show game over overlay and focus restart button.
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   * @param {HTMLElement|null} finalScoreEl
   * @param {number} score
   * @param {boolean} [preserveScroll=false]  If true, attempt to focus without causing page scroll.
   */
  static showGameOver(gameOverScreen, restartBtn, finalScoreEl, score, preserveScroll = false) {
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (gameOverScreen) gameOverScreen.classList.remove("hidden");
    // Remember caller preference so document-level focus guards use the
    // scroll-preserving focus method for a short period.
    if (preserveScroll) {
      UIManager._preserveFocus = true;
      // Clear the preference after a longer grace period so slower mobile
      // browsers have time to accept focus after native prompts.
      let preserveTimeout;
      const clearPreserve = () => {
        UIManager._preserveFocus = false;
        try {
          if (preserveTimeout) clearTimeout(preserveTimeout);
        } catch (_) {
          /* ignore */
        }
      };
      try {
        preserveTimeout = setTimeout(() => {
          UIManager._preserveFocus = false;
        }, 5000);
      } catch (_) {
        UIManager._preserveFocus = false;
      }

      // Attempt immediate focus (best-effort). If the browser requires a
      // user gesture (common on Android) listen for the next interaction on
      // the overlay and focus then. This preserves scrolling while still
      // letting the button receive focus as soon as the user interacts.
      UIManager.focusPreserveScroll(restartBtn);
      // If the browser blocks real focus, provide a visible fallback so
      // users still see the Play/Restart button as the intended target.
      try {
        if (restartBtn && document.activeElement !== restartBtn) {
          restartBtn.classList.add("js-force-focus");
        }
      } catch (_) {
        /* ignore */
      }
      // Attempt clear visual indicator removal later if focus finally succeeds.
      try {
        const onFocusIn = () => {
          try {
            if (document.activeElement === restartBtn) {
              try {
                if (restartBtn) restartBtn.classList.remove("js-force-focus");
              } catch (_) {
                /* ignore */
              }
              clearPreserve();
              document.removeEventListener("focusin", onFocusIn);
            }
          } catch (_) {
            /* ignore */
          }
        };
        document.addEventListener("focusin", onFocusIn);
      } catch (_) {
        /* ignore */
      }
    } else {
      UIManager.focusWithRetry(restartBtn);
    }
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
        // Prefer focus with options when available to avoid scrolling.
        el.focus({ preventScroll: true });
        // Some mobile browsers ignore focus(options); try plain focus as fallback.
      } catch (_) {
        try {
          el.focus();
        } catch (_) {
          /* ignore */
        }
      }
      // If focus with options didn't take effect, try plain focus too.
      try {
        if (document.activeElement !== el) el.focus();
      } catch (_) {
        /* ignore */
      }
    };
    tryFocus();
    // Retry focusing a few times. If the browser still doesn't honor focus
    // (common on some mobile browsers), add a temporary CSS class to give a
    // visible focus indication so users see the Play/Restart button is the
    // intended target.
    if (document.activeElement !== el) {
      requestAnimationFrame(() => {
        tryFocus();
        if (document.activeElement !== el) {
          setTimeout(() => {
            tryFocus();
            if (document.activeElement !== el) {
              setTimeout(() => {
                tryFocus();
                if (document.activeElement !== el) {
                  setTimeout(() => {
                    tryFocus();
                    // If focus still failed, add temporary visual indicator
                    if (document.activeElement !== el) {
                      try {
                        el.classList.add("js-force-focus");
                        setTimeout(() => {
                          el.classList.remove("js-force-focus");
                        }, 2000);
                      } catch (_) {
                        /* ignore */
                      }
                    }
                  }, 750);
                }
              }, 250);
            }
          }, 100);
        }
      });
    }
  }

  /** Try focusing an element while preserving the document scroll position.
   * This attempts focus with {preventScroll:true} when supported, and as a
   * fallback will save/restore scroll coordinates around a plain focus call
   * so the act of focusing doesn't jump the page. Use this when you want the
   * element to receive focus but still allow the user to scroll the overlay
   * (e.g. leaderboard) immediately afterwards.
   * @param {HTMLElement|null} el
   */
  static focusPreserveScroll(el) {
    if (!el) return;
    const tryFocus = () => {
      try {
        // Prefer focus with options when available to avoid scrolling.
        el.focus({ preventScroll: true });
      } catch (_) {
        try {
          // Save scroll then focus and restore to avoid jumps in browsers
          // that don't honor preventScroll.
          const scrollX =
            typeof window.scrollX === "number" ? window.scrollX : window.pageXOffset || 0;
          const scrollY =
            typeof window.scrollY === "number" ? window.scrollY : window.pageYOffset || 0;
          el.focus();
          try {
            window.scrollTo(scrollX, scrollY);
          } catch (_) {
            /* ignore */
          }
        } catch (_) {
          /* ignore */
        }
      }
      try {
        if (document.activeElement !== el) {
          // Attempt plain focus as last resort then restore scroll.
          const scrollX =
            typeof window.scrollX === "number" ? window.scrollX : window.pageXOffset || 0;
          const scrollY =
            typeof window.scrollY === "number" ? window.scrollY : window.pageYOffset || 0;
          el.focus();
          try {
            window.scrollTo(scrollX, scrollY);
          } catch (_) {
            /* ignore */
          }
        }
      } catch (_) {
        /* ignore */
      }
    };

    // Run initial attempt and a sequence of retries like focusWithRetry so
    // mobile browsers that delay focusing still receive focus.
    tryFocus();
    if (document.activeElement !== el) {
      requestAnimationFrame(() => {
        tryFocus();
        if (document.activeElement !== el) {
          setTimeout(() => {
            tryFocus();
            if (document.activeElement !== el) {
              setTimeout(() => {
                tryFocus();
                if (document.activeElement !== el) {
                  setTimeout(() => {
                    tryFocus();
                  }, 750);
                }
              }, 250);
            }
          }, 100);
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
      if (UIManager._preserveFocus) UIManager.focusPreserveScroll(restartBtn);
      else UIManager.focusWithRetry(restartBtn);
      return;
    }
    if (gameInfo && !gameInfo.classList.contains("hidden")) {
      if (UIManager._preserveFocus) UIManager.focusPreserveScroll(startBtn);
      else UIManager.focusWithRetry(startBtn);
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

  /** Document-level focusin guard to restore focus to visible overlay button on mobile.
   * @param {FocusEvent} e
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static handleDocumentFocusIn(e, gameInfo, startBtn, gameOverScreen, restartBtn) {
    const overlayGameOverVisible = !!(
      gameOverScreen && !gameOverScreen.classList.contains("hidden")
    );
    const overlayStartVisible = !!(gameInfo && !gameInfo.classList.contains("hidden"));
    if (!overlayGameOverVisible && !overlayStartVisible) return;

    const t = UIManager.isElement(e && e.target) ? /** @type {Element} */ (e.target) : null;
    if (overlayGameOverVisible) {
      const isRestart =
        t === restartBtn || (t && typeof t.closest === "function" && t.closest("#restartBtn"));
      if (!isRestart) {
        if (UIManager._preserveFocus) UIManager.focusPreserveScroll(restartBtn);
        else UIManager.focusWithRetry(restartBtn);
      }
      return;
    }
    if (overlayStartVisible) {
      const isStart =
        t === startBtn || (t && typeof t.closest === "function" && t.closest("#startBtn"));
      if (!isStart) UIManager.focusWithRetry(startBtn);
    }
  }

  /** Focus guard while Start overlay is visible.
   * @param {Event} e
   * @param {HTMLElement|null} gameInfo
   * @param {HTMLElement|null} startBtn
   */
  static handleStartScreenFocusGuard(e, gameInfo, startBtn) {
    if (!gameInfo || gameInfo.classList.contains("hidden")) return;
    const t = UIManager.isElement(e && e.target) ? /** @type {Element} */ (e.target) : null;
    // Allow links (e.g. About) inside the overlay to be activated
    const targetIsLink = t && typeof t.closest === "function" && t.closest("a");
    if (targetIsLink) return;
    const targetIsStart =
      t === startBtn || (t && typeof t.closest === "function" && t.closest("#startBtn"));
    if (!targetIsStart) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    if (UIManager._preserveFocus) UIManager.focusPreserveScroll(startBtn);
    else UIManager.focusWithRetry(startBtn);
  }

  /** Focus guard while Game Over overlay is visible.
   * @param {Event} e
   * @param {HTMLElement|null} gameOverScreen
   * @param {HTMLElement|null} restartBtn
   */
  static handleGameOverFocusGuard(e, gameOverScreen, restartBtn) {
    if (!gameOverScreen || gameOverScreen.classList.contains("hidden")) return;
    const t = UIManager.isElement(e && e.target) ? /** @type {Element} */ (e.target) : null;
    // Allow links inside the game over overlay to be activated
    const targetIsLink = t && typeof t.closest === "function" && t.closest("a");
    if (targetIsLink) return;
    // Allow interaction with leaderboard (for scrolling/touch)
    const leaderboard = document.getElementById("leaderboardList");
    const targetIsLeaderboard =
      leaderboard &&
      t &&
      (t === leaderboard || (typeof t.closest === "function" && t.closest("#leaderboardList")));
    if (targetIsLeaderboard) return;
    const targetIsRestart =
      t === restartBtn || (t && typeof t.closest === "function" && t.closest("#restartBtn"));
    // Do not prevent default or stop propagation here: allow touch/scroll
    // interactions (e.g. scrolling the leaderboard) to continue. Only
    // ensure the restart button regains focus when appropriate.
    if (!targetIsRestart) {
      // let the event continue so users can scroll/tap the leaderboard
    }
    if (UIManager._preserveFocus) UIManager.focusPreserveScroll(restartBtn);
    else UIManager.focusWithRetry(restartBtn);
  }
}
