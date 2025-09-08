/**
 * LeaderboardManager: simple client-side top-N leaderboard using localStorage.
 * Stores entries as [{id, score, meta}] sorted by score desc. No PII collected.
 */
export class LeaderboardManager {
  static KEY = "darkHorizonLeaderboard:v1";
  static MAX_ENTRIES = 100;

  /**
   * Load leaderboard entries (safe).
   * @returns {{id:string,score:number,meta:string}[]}
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
        meta: String(e.meta || ""),
      }));
    } catch (_) {
      return [];
    }
  }

  /**
   * Save leaderboard entries (safe).
   * @param {{id:string,score:number,meta:string}[]} entries
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
   * Create a lightweight client identifier.
   * We avoid PII: use hashed userAgent + origin fingerprint and time suffix.
   * @returns {string}
   */
  static makeId() {
    try {
      const ua = navigator.userAgent || "";
      const origin = location && location.origin ? location.origin : "";
      // simple deterministic hash32
      let s = ua + "|" + origin;
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return `c${(h >>> 0).toString(36)}`;
    } catch (_) {
      return `c${Date.now().toString(36)}`;
    }
  }

  /**
   * Create a small meta string for display (short UA hint).
   */
  static makeMeta() {
    try {
      const ua = navigator.userAgent || "";
      // Prefer User-Agent Client Hints when available for more accurate brand info
      const uaData = /** @type {any} */ (navigator).userAgentData;
      const device =
        uaData && typeof uaData.mobile === "boolean"
          ? uaData.mobile
            ? "Mobile"
            : "Desktop"
          : /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)
            ? "Mobile"
            : "Desktop";

      let browser = "?";

      // If client hints are available, inspect the brands array first.
      if (uaData && Array.isArray(uaData.brands) && uaData.brands.length) {
        for (const b of uaData.brands) {
          const brand = String((b && b.brand) || "");
          if (/Edge|Edg|Microsoft Edge/i.test(brand)) {
            browser = "Edge";
            break;
          }
          if (/DuckDuckGo/i.test(brand)) {
            browser = "DuckDuckGo";
            break;
          }
          if (/Firefox/i.test(brand)) {
            browser = "Firefox";
            break;
          }
          if (/Chrome|Chromium|Google/i.test(brand)) {
            browser = "Chrome";
            break;
          }
          if (/Safari/i.test(brand)) {
            browser = "Safari";
            break;
          }
        }
      }

      // Fallback: regex checks against navigator.userAgent. Prefer specific tokens
      // (Edge variants, DuckDuckGo) before Chrome so they aren't misclassified.
      if (browser === "?") {
        /** @type {[RegExp, string][]} */
        const checks = [
          [/EdgA|EdgiOS|Edg\//i, "Edge"],
          [/\bEdge\//i, "Edge"],
          [/DuckDuckGo|DuckDuck/i, "DuckDuckGo"],
          [/FxiOS|Firefox\//i, "Firefox"],
          [/CriOS|Chrome\//i, "Chrome"],
          [/Safari\//i, "Safari"],
        ];
        for (const pair of checks) {
          const rx = pair[0];
          const label = pair[1];
          if (rx instanceof RegExp && rx.test(ua)) {
            browser = label;
            break;
          }
        }
      }

      // store only device-browser (avoid storing full user-agent)
      return `${device}-${browser}`;
    } catch (_) {
      return "?";
    }
  }

  /**
   * Deterministic, non-PII display name derived from the client id.
   * Produces names like "Crimson Falcon #42" so the top-10 list is friendlier.
   * @param {string} id
   * @returns {string}
   */
  static makeDisplayName(id) {
    try {
      if (!id) return "Player";
      const adjs = [
        "Crimson",
        "Silent",
        "Quantum",
        "Nebula",
        "Dusky",
        "Azure",
        "Solar",
        "Atomic",
        "Iron",
        "Velvet",
        "Lucky",
        "Ghost",
        "Rapid",
        "Stellar",
        "Obsidian",
        "Radiant",
      ];
      const nouns = [
        "Falcon",
        "Warden",
        "Runner",
        "Raven",
        "Voyager",
        "Drifter",
        "Pilot",
        "Nomad",
        "Mender",
        "Strider",
        "Corsair",
        "Seeker",
        "Rider",
        "Shade",
        "Specter",
        "Anchor",
      ];
      // simple signed hash
      let h = 0;
      for (let i = 0; i < id.length; i++) {
        h = (h << 5) - h + id.charCodeAt(i);
        h |= 0;
      }
      const n = Math.abs(h) >>> 0;
      const adj = adjs[n % adjs.length];
      const noun = nouns[(n >>> 8) % nouns.length];
      const num = (n >>> 16) % 100;
      return `${adj} ${noun} #${String(num).padStart(2, "0")}`;
    } catch (_) {
      return "Player";
    }
  }

  /**
   * Make a short deterministic badge: color emoji + two-digit number (e.g. "🔴#42").
   * Derived from the client id only (no PII).
   * @param {string} id
   * @returns {string}
   */
  static makeBadge(id) {
    try {
      if (!id) return "Anon";
      const palette = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤"];
      // simple signed hash
      let h = 0;
      for (let i = 0; i < id.length; i++) {
        h = (h << 5) - h + id.charCodeAt(i);
        h |= 0;
      }
      const n = Math.abs(h) >>> 0;
      const emoji = palette[n % palette.length];
      const num = (n >>> 8) % 100;
      return `${emoji}#${String(num).padStart(2, "0")}`;
    } catch (_) {
      return "Anon";
    }
  }

  /**
   * Produce a short, deterministic, non-PII id for display (e.g. 'c1k9x0').
   * Derived from the stored client id so it's stable for the same client.
   * @param {string} id
   * @returns {string}
   */
  static makeShortId(id) {
    try {
      if (!id) return "anon";
      // Hash the id string into a 32-bit value, then convert to base36 and trim.
      let h = 0;
      for (let i = 0; i < id.length; i++) {
        h = (h << 5) - h + id.charCodeAt(i);
        h |= 0;
      }
      const n = (h >>> 0) >>> 0;
      let s = n.toString(36);
      if (s.length < 6) s = s.padStart(6, "0");
      return `c${s.slice(0, 6)}`;
    } catch (_) {
      return "anon";
    }
  }

  /**
   * Map a meta string like "Desktop-Chrome" to a small emoji hint.
   * Returns a leading space plus emojis or empty string.
   * @param {string} meta
   * @returns {string}
   */
  static metaToEmoji(meta) {
    try {
      if (!meta) return "";
      const deviceMap = new Map([
        ["Desktop", "Desktop"],
        ["Mobile", "Mobile"],
      ]);
      // meta is 'Device-Browser'
      const parts = String(meta).split("-");
      const device = parts[0] || "";
      const browser = parts[1] || "";
      const deviceLabel = deviceMap.get(device) || "";
      const browserText = browser ? ` ${browser}` : "";
      return deviceLabel ? `${deviceLabel}${browserText}` : browserText;
    } catch (_) {
      return "";
    }
  }

  /**
   * Submit a score and persist top-N.
   * @param {number} score
   */
  static submit(score) {
    if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return false;
    const entries = LeaderboardManager.load();
    const id = LeaderboardManager.makeId();
    const meta = LeaderboardManager.makeMeta();
    entries.push({ id, score: Math.floor(score), meta });
    // sort desc
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
    // Clear children safely without assigning HTML (Trusted Types CSP)
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    if (!entries || entries.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No scores yet";
      listEl.appendChild(li);
      return;
    }
    entries.slice(0, 100).forEach((e, idx) => {
      const li = document.createElement("li");
      // show #1/#2/#3... for all entries, compact stable short id, and score only
      const rank = `#${idx + 1}`;
      const badge = LeaderboardManager.makeShortId(e.id || "");
      li.textContent = `${rank} ${badge} — ${e.score}`;
      listEl.appendChild(li);
    });
    return;
  }
}

export default LeaderboardManager;
