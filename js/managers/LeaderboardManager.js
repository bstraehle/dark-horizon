/**
 * LeaderboardManager: simple client-side top-N leaderboard using localStorage.
 * Stores entries as [{id, score}] sorted by score desc. No PII collected.
 */
export class LeaderboardManager {
  static KEY = "darkHorizonLeaderboard:v1";
  static IS_REMOTE = true;
  static REMOTE_ENDPOINT =
    "https://0p6x6bw6c2.execute-api.us-west-2.amazonaws.com/dev/leaderboard?id=1";
  // Server-side leaderboard identifier used when posting scores
  static MAX_ENTRIES = 10;

  /**
   * Load leaderboard entries (safe).
   * For remote=true returns a Promise resolving to the array.
   * @param {{remote?:boolean}=} options
   * @returns {{id:string,score:number}[]|Promise<{id:string,score:number}[]>}
   */
  static load({ remote = this.IS_REMOTE } = {}) {
    if (!remote) {
      try {
        const raw = localStorage.getItem(LeaderboardManager.KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((e) => ({
          id: String(e.id || ""),
          score: Number(e.score || 0),
        }));
      } catch (_) {
        return [];
      }
    }

    // Remote: return a Promise resolving to the entries array.
    // If fetch isn't available (older browsers or test env), fallback to local storage.
    if (typeof fetch !== "function") {
      try {
        const raw = localStorage.getItem(LeaderboardManager.KEY);
        if (!raw) return Promise.resolve([]);
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return Promise.resolve([]);
        return Promise.resolve(
          parsed.map((e) => ({ id: String(e.id || ""), score: Number(e.score || 0) }))
        );
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

    if (typeof console !== "undefined" && console && typeof console.debug === "function") {
      console.debug(
        "LeaderboardManager: fetching remote leaderboard from",
        LeaderboardManager.REMOTE_ENDPOINT
      );
    }
    return fetch(LeaderboardManager.REMOTE_ENDPOINT, { method: "GET" })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((parsed) => {
        // Server may return either an array of entries, or an object like
        // { id: 1, scores: [ {score, id}, ... ], updatedAt: "..." }
        let arr = null;
        if (Array.isArray(parsed)) arr = parsed;
        else if (parsed && Array.isArray(parsed.scores)) arr = parsed.scores;
        if (!arr) return [];
        return /** @type {{id:any,score:any}[]} */ (arr).map(
          /** @param {{id:any,score:any}} e */ (e) => ({
            id: String(e.id || ""),
            score: Number(e.score || 0),
          })
        );
      })
      .catch(() => []);
  }

  /**
   * Save leaderboard entries (safe).
   * For remote=true returns a Promise resolving to boolean.
   * @param {{id:string,score:number}[]} entries
   * @param {{remote?:boolean}=} options
   * @returns {boolean|Promise<boolean>}
   */
  static save(entries, { remote = this.IS_REMOTE } = {}) {
    const payload = entries.slice(0, LeaderboardManager.MAX_ENTRIES);
    if (!remote) {
      try {
        localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(payload));
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
        localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(payload));
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
            localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(payload));
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
              localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(payload));
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
              localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(normalized));
            } catch (_) {
              /* ignore */
            }
            // Dispatch a DOM event so any UI can update immediately without requiring a full reload.
            try {
              if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                // Prefer the window's CustomEvent (available in jsdom) and safely
                // fall back if not present.
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
          localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(payload));
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
   * @param {number} score
   * @param {string} userId
   */
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
  static render(listEl) {
    if (!listEl) return;
    // Always render local entries synchronously first for immediate feedback.
    const localEntries = LeaderboardManager.load({ remote: false });

    const doRender = /** @param {{id:string,score:number}[]} entries */ (entries) => {
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      if (!entries || entries.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No scores yet";
        listEl.appendChild(li);
        return;
      }
      entries.slice(0, 100).forEach((e, idx) => {
        const li = document.createElement("li");
        const rank = `#${idx + 1}`;
        let badge;
        if (/^[A-Z]{1,3}$/.test(e.id)) {
          badge = e.id;
        } else {
          badge = "???";
        }
        const medals = ["🥇", "🥈", "🥉"];
        const medalPrefix = idx >= 0 && idx < 3 ? medals[idx] + " " : "";
        const outsideTopThreePrefix = idx >= 3 ? "👍 " : "";
        li.textContent = `${medalPrefix}${outsideTopThreePrefix}${rank} ${badge} — ${e.score}`;
        listEl.appendChild(li);
      });
    };

    // Render local entries immediately.
    if (Array.isArray(localEntries)) {
      doRender(localEntries);
    }

    // If remote loading is enabled, fetch and re-render when available.
    if (LeaderboardManager.IS_REMOTE) {
      const remoteEntriesPromise = LeaderboardManager.load({ remote: true });
      if (
        !Array.isArray(remoteEntriesPromise) &&
        remoteEntriesPromise &&
        typeof remoteEntriesPromise.then === "function"
      ) {
        remoteEntriesPromise.then(doRender).catch(() => {
          // keep local rendering if remote fails
        });
      }
    }
    return;
  }
}

export default LeaderboardManager;
