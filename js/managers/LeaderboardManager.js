/**
 * LeaderboardManager: simple client-side top-N leaderboard using localStorage or a remote server.
 * Stores entries as [{id, score}] sorted by score desc. No PII collected.
 */
export class LeaderboardManager {
  static IS_REMOTE = true;
  static REMOTE_ENDPOINT =
    "https://0p6x6bw6c2.execute-api.us-west-2.amazonaws.com/dev/leaderboard?id=1";
  // Server-side leaderboard identifier used when posting scores
  static MAX_ENTRIES = 10;
  static KEY_LEADERBOARD = "aiHorizonLeaderboard";
  /** @type {{id:string,score:number}[]|null} */
  static _cacheEntries = null;
  /** @type {Promise<{id:string,score:number}[]>|null} */
  static _pendingLoadPromise = null;
  // Guard to only log/trace the first load invocation to avoid duplicate console spam
  static _hasLoggedLoad = false;

  /**
   * Load the high score derived from the persisted leaderboard.
   * By default reads the local leaderboard (remote=false).
   * @param {{remote?:boolean}=} options
   * @returns {number|Promise<number>}
   */
  static loadHighScore({ remote = false } = {}) {
    try {
      const maybe = LeaderboardManager.load({ remote });
      if (Array.isArray(maybe)) {
        return maybe.reduce((max, e) => Math.max(max, Number(e.score || 0)), 0);
      }
      // remote path: returns a Promise
      return /** @type {Promise<{id:string,score:number}[]>} */ (maybe).then((entries) =>
        (entries || []).reduce((max, e) => Math.max(max, Number(e.score || 0)), 0)
      );
    } catch (_) {
      return 0;
    }
  }

  /**
   * Update the high score display and return the current high.
   * High score is derived from leaderboard entries (no separate persistence).
   * @param {number} score
   * @param {number} [prevHigh]
   * @param {HTMLElement|null} [highScoreEl]
   * @returns {number}
   */
  static setHighScore(score, prevHigh, highScoreEl) {
    let high = prevHigh || 0;
    if (score > high) {
      high = score;
      // no localStorage write here: high is derived from leaderboard entries
    }
    try {
      if (highScoreEl) highScoreEl.textContent = String(high);
    } catch (_) {
      /* ignore */
    }
    return high;
  }

  /**
   * Load leaderboard entries (safe).
   * For remote=true returns a Promise resolving to the array.
   * @param {{remote?:boolean}=} options
   * @returns {{id:string,score:number}[]|Promise<{id:string,score:number}[]>}
   */
  static load({ remote = this.IS_REMOTE } = {}) {
    if (!LeaderboardManager._hasLoggedLoad) {
      if (typeof console !== "undefined" && console && typeof console.log === "function") {
        console.log("LeaderboardManager: load", { remote });
      }
      try {
        if (typeof console !== "undefined" && console && typeof console.trace === "function") {
          console.trace("LeaderboardManager.load called");
        }
      } catch (_e) {
        /* ignore */
      }
      LeaderboardManager._hasLoggedLoad = true;
    }

    // Local-only path: return cached entries when available, else read localStorage
    if (!remote) {
      try {
        if (Array.isArray(LeaderboardManager._cacheEntries))
          return LeaderboardManager._cacheEntries.slice();
        const raw = localStorage.getItem(LeaderboardManager.KEY_LEADERBOARD);
        if (!raw) {
          LeaderboardManager._cacheEntries = [];
          return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          LeaderboardManager._cacheEntries = [];
          return [];
        }
        const normalized = parsed.map(
          /** @param {{id:any,score:any}} e */
          (e) => ({ id: String(e.id || ""), score: Number(e.score || 0) })
        );
        LeaderboardManager._cacheEntries = normalized;
        return normalized.slice();
      } catch (_) {
        LeaderboardManager._cacheEntries = [];
        return [];
      }
    }

    // Remote path: memoize pending fetch to avoid duplicate network requests
    if (LeaderboardManager._pendingLoadPromise) return LeaderboardManager._pendingLoadPromise;

    if (typeof fetch !== "function") {
      try {
        const local = LeaderboardManager.load({ remote: false });
        return Promise.resolve(Array.isArray(local) ? local : []);
      } catch (err) {
        if (typeof console !== "undefined" && console && typeof console.warn === "function") {
          console.warn(
            "LeaderboardManager: fetch unavailable, loaded leaderboard from localStorage as fallback.",
            err
          );
        }
        return Promise.resolve([]);
      }
    }

    LeaderboardManager._pendingLoadPromise = fetch(LeaderboardManager.REMOTE_ENDPOINT, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((parsed) => {
        let arr = null;
        if (Array.isArray(parsed)) arr = parsed;
        else if (parsed && Array.isArray(parsed.scores)) arr = parsed.scores;
        if (!arr) {
          LeaderboardManager._cacheEntries = [];
          return [];
        }
        const normalized = arr.map(
          /** @param {{id:any,score:any}} e */
          (e) => ({ id: String(e.id || ""), score: Number(e.score || 0) })
        );
        try {
          localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(normalized));
        } catch (_e) {
          /* ignore */
        }
        LeaderboardManager._cacheEntries = normalized;
        return normalized.slice();
      })
      .catch(() => [])
      .finally(() => {
        LeaderboardManager._pendingLoadPromise = null;
      });

    return LeaderboardManager._pendingLoadPromise;
  }

  /**
   * Save leaderboard entries (safe).
   * For remote=true returns a Promise resolving to boolean.
   * @param {{id:string,score:number}[]} entries
   * @param {{remote?:boolean}=} options
   * @returns {boolean|Promise<boolean>}
   */
  static save(entries, { remote = this.IS_REMOTE } = {}) {
    // Use debug-level logging where available and avoid logging the whole
    // entries array to reduce console noise. Include entry count for context.
    try {
      if (typeof console !== "undefined" && console && typeof console.debug === "function") {
        console.debug("LeaderboardManager: save", {
          remote,
          count: Array.isArray(entries) ? entries.length : undefined,
        });
      }
    } catch (_) {
      /* ignore logging failures */
    }
    const payload = entries.slice(0, LeaderboardManager.MAX_ENTRIES);
    if (!remote) {
      try {
        localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(payload));
        LeaderboardManager._cacheEntries = payload.slice();
        return true;
      } catch (_) {
        return false;
      }
    }
    // Remote: return a Promise resolving to boolean success.
    // If fetch isn't available (older browsers or test env), fallback to local storage.
    if (typeof fetch !== "function") {
      try {
        // Best-effort: persist payload locally when remote not possible.
        localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(payload));
        if (typeof console !== "undefined" && console && typeof console.warn === "function") {
          console.warn(
            "LeaderboardManager: fetch unavailable, saved leaderboard locally as fallback."
          );
        }
        return Promise.resolve(true);
      } catch (err) {
        if (typeof console !== "undefined" && console && typeof console.error === "function") {
          console.error("LeaderboardManager: failed to save locally as fallback", err);
        }
        return Promise.resolve(false);
      }
    }

    // Send a structured payload the server expects: { scores: [...], id: <leaderboard id> }
    const body = JSON.stringify({ scores: payload });
    if (typeof console !== "undefined" && console && typeof console.debug === "function") {
      console.debug(
        "LeaderboardManager: posting leaderboard to",
        LeaderboardManager.REMOTE_ENDPOINT,
        body
      );
    }
    return fetch(LeaderboardManager.REMOTE_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then((res) => {
        if (!res.ok) {
          // Attempt to persist locally as fallback
          try {
            localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(payload));
          } catch (_) {
            /* ignore */
          }
          if (typeof console !== "undefined" && console && typeof console.warn === "function") {
            // Include the request payload to help debug remote save failures
            try {
              console.warn(
                "LeaderboardManager: remote save failed (status " + res.status + ") - payload:",
                body,
                "- saved locally as fallback."
              );
            } catch (_e) {
              // Fallback to a simple string message if console.warn can't handle complex objects in some envs
              console.warn(
                "LeaderboardManager: remote save failed (status " +
                  res.status +
                  "), saved locally as fallback."
              );
            }
          }
          return false;
        }

        // If server responded ok, attempt to parse the response body which should use
        // the same shape as `load` (either an array of entries or { scores: [...] }).
        /** @param {{id:any,score:any}[]|null} arr */
        const handleAndPersist = (arr) => {
          if (!arr) {
            // No usable payload returned: persist the payload we sent as a best-effort fallback.
            try {
              localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(payload));
            } catch (_) {
              /* ignore */
            }
            return Promise.resolve(true);
          }

          // Normalize returned entries and persist to localStorage so the client is repopulated
          try {
            const normalized = /** @type {{id:any,score:any}[]} */ (arr)
              .map(
                /** @param {{id:any,score:any}} e */
                (e) => ({ id: String(e.id || ""), score: Number(e.score || 0) })
              )
              .slice(0, LeaderboardManager.MAX_ENTRIES);
            try {
              localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(normalized));
            } catch (_) {
              /* ignore */
            }
            LeaderboardManager._cacheEntries = normalized.slice();
            // Dispatch a DOM event so any UI can update immediately without requiring a full reload.
            try {
              if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                const CE =
                  typeof window.CustomEvent === "function"
                    ? window.CustomEvent
                    : typeof CustomEvent === "function"
                      ? CustomEvent
                      : null;
                if (CE) {
                  window.dispatchEvent(new CE("leaderboard:updated", { detail: normalized }));
                }
              }
            } catch (_) {
              /* ignore */
            }
            return Promise.resolve(true);
          } catch (_) {
            return Promise.resolve(true);
          }
        };

        return res
          .json()
          .then((parsed) => {
            let arr = null;
            if (Array.isArray(parsed)) arr = parsed;
            else if (parsed && Array.isArray(parsed.scores)) arr = parsed.scores;
            if (arr) return handleAndPersist(arr);

            // If the PUT response didn't include usable data (204/no body), try a follow-up GET
            return fetch(LeaderboardManager.REMOTE_ENDPOINT, { method: "GET" })
              .then((r2) => {
                if (!r2.ok) return null;
                return r2.json();
              })
              .then((parsed2) => {
                let arr2 = null;
                if (Array.isArray(parsed2)) arr2 = parsed2;
                else if (parsed2 && Array.isArray(parsed2.scores)) arr2 = parsed2.scores;
                return handleAndPersist(arr2);
              })
              .catch(() => {
                // If follow-up GET fails, persist the payload as fallback
                return handleAndPersist(null);
              });
          })
          .catch(() => {
            // Couldn't parse JSON body: try a follow-up GET before falling back.
            return fetch(LeaderboardManager.REMOTE_ENDPOINT, { method: "GET" })
              .then((r2) => {
                if (!r2.ok) return null;
                return r2.json();
              })
              .then((parsed2) => {
                let arr2 = null;
                if (Array.isArray(parsed2)) arr2 = parsed2;
                else if (parsed2 && Array.isArray(parsed2.scores)) arr2 = parsed2.scores;
                return handleAndPersist(arr2);
              })
              .catch(() => handleAndPersist(null));
          });
      })
      .catch((err) => {
        // network or other error - fallback to local storage
        try {
          localStorage.setItem(LeaderboardManager.KEY_LEADERBOARD, JSON.stringify(payload));
        } catch (_) {
          /* ignore */
        }
        if (typeof console !== "undefined" && console && typeof console.error === "function") {
          // Include the request payload to help debug network errors during remote save
          try {
            console.error(
              "LeaderboardManager: remote save failed - payload:",
              body,
              "- saved locally as fallback",
              err
            );
          } catch (_e) {
            console.error("LeaderboardManager: remote save failed, saved locally as fallback", err);
          }
        }
        return false;
      });
  }

  /**
   * Submit a score and persist top-N.
   * For remote=true returns a Promise resolving to boolean.
   * @param {number} score
   * @param {string} userId
   * @param {{remote?:boolean}=} options
   * @returns {boolean|Promise<boolean>}
   */
  static submit(score, userId, { remote = false } = {}) {
    if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return false;

    /**
     * Comparator for entries.
     * @param {{id:string,score:number}} a
     * @param {{id:string,score:number}} b
     * @returns {number}
     */
    const compareEntries = (a, b) => b.score - a.score || a.id.localeCompare(b.id);

    /**
     * @param {{id:string,score:number}[]} entries
     */
    const handleEntriesAndSave = (entries) => {
      const id = userId && /^[A-Z]{1,3}$/.test(userId) ? userId : "???";
      entries.push({ id, score: Math.floor(score) });
      entries.sort(compareEntries);
      return LeaderboardManager.save(entries.slice(0, LeaderboardManager.MAX_ENTRIES), { remote });
    };

    const maybeEntries = LeaderboardManager.load({ remote });
    // Synchronous path
    if (Array.isArray(maybeEntries)) {
      return handleEntriesAndSave(maybeEntries);
    }

    // Remote: returned a Promise
    return maybeEntries.then(
      /** @param {{id:string,score:number}[]} entries */ (entries) => handleEntriesAndSave(entries)
    );
  }

  /**
   * Render leaderboard into an ordered list element.
   * @param {HTMLElement|null} listEl
   */
  /**
   * Render leaderboard into an ordered list element.
   * If `entries` is provided, use it directly instead of calling `load()`
   * which avoids double-loading when the caller already fetched the data.
   * @param {HTMLElement|null} listEl
   * @param {{id:string,score:number}[]=} entries
   */
  static render(listEl, entries) {
    if (!listEl) return;

    /**
     * @param {{id:string,score:number}[]} entriesToRender
     */
    const doRender = (entriesToRender) => {
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      if (!entriesToRender || entriesToRender.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No scores yet";
        listEl.appendChild(li);
        return;
      }
      entriesToRender.slice(0, 100).forEach(
        /** @param {{id:string,score:number}} e */
        (e, idx) => {
          const li = document.createElement("li");
          const rank = `${idx + 1}`;
          let badge;
          if (/^[A-Z]{1,3}$/.test(e.id)) {
            badge = e.id;
          } else {
            badge = "???";
          }
          const medals = ["🥇", "🥈", "🥉"];
          const medalPrefix = idx >= 0 && idx < 3 ? medals[idx] + " " : "";
          const outsideTopThreePrefix = idx >= 3 ? "👍 " : "";
          li.textContent = `${medalPrefix}${outsideTopThreePrefix}${rank} — ${badge} — ${e.score}`;
          listEl.appendChild(li);
        }
      );
    };

    // If entries were provided by the caller, render them and return.
    if (Array.isArray(entries)) {
      doRender(entries);
      return;
    }

    // Otherwise behave as before: render local entries then optionally
    // fetch remote entries and re-render.
    const localEntries = LeaderboardManager.load({ remote: false });
    if (Array.isArray(localEntries)) {
      doRender(localEntries);
    }
    if (LeaderboardManager.IS_REMOTE) {
      const remoteEntriesPromise = LeaderboardManager.load({ remote: true });
      if (
        !Array.isArray(remoteEntriesPromise) &&
        remoteEntriesPromise &&
        typeof remoteEntriesPromise.then === "function"
      ) {
        remoteEntriesPromise.then(doRender).catch(() => {});
      }
    }
    return;
  }
}

export default LeaderboardManager;
