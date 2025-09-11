/**
 * LeaderboardManager: simple client-side top-N leaderboard using localStorage.
 * Stores entries as [{id, score}] sorted by score desc. No PII collected.
 */
export class LeaderboardManager {
  static KEY = "darkHorizonLeaderboard:v1";
  static IS_REMOTE = false;
  static REMOTE_ENDPOINT = "https://example.com/api/leaderboard";
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
    return fetch(LeaderboardManager.REMOTE_ENDPOINT, { method: "GET" })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((parsed) => {
        if (!Array.isArray(parsed)) return [];
        return parsed.map((e) => ({ id: String(e.id || ""), score: Number(e.score || 0) }));
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
    return fetch(LeaderboardManager.REMOTE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.ok)
      .catch(() => false);
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
    const entries = LeaderboardManager.load();

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

    if (Array.isArray(entries)) {
      doRender(entries);
      return;
    }

    // Remote: entries is a Promise
    entries.then(doRender).catch(() => {
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      const li = document.createElement("li");
      li.textContent = "No scores yet";
      listEl.appendChild(li);
    });
    return;
  }
}

export default LeaderboardManager;
