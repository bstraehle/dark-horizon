/**
 * LeaderboardManager: simple client-side top-N leaderboard using localStorage.
 * Stores entries as [{id, score}] sorted by score desc. No PII collected.
 */
export class LeaderboardManager {
  static KEY = "darkHorizonLeaderboard:v1";
  static MAX_ENTRIES = 100;

  /**
   * Load leaderboard entries (safe).
   * @returns {{id:string,score:number}[]}
   */
  static load() {
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

  /**
   * Save leaderboard entries (safe).
   * @param {{id:string,score:number}[]} entries
   */
  static save(entries) {
    try {
      localStorage.setItem(
        LeaderboardManager.KEY,
        JSON.stringify(entries.slice(0, LeaderboardManager.MAX_ENTRIES))
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Submit a score and persist top-N.
   * @param {number} score
   * @param {string} userId
   */
  static submit(score, userId) {
    if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return false;
    const entries = LeaderboardManager.load();
    const id = userId && /^[A-Z]{1,3}$/.test(userId) ? userId : "???";
    entries.push({ id, score: Math.floor(score) });
    entries.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return LeaderboardManager.save(entries.slice(0, LeaderboardManager.MAX_ENTRIES));
  }

  /**
   * Render leaderboard into an ordered list element.
   * @param {HTMLElement|null} listEl
   */
  static render(listEl) {
    if (!listEl) return;
    const entries = LeaderboardManager.load();
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
    return;
  }
}

export default LeaderboardManager;
