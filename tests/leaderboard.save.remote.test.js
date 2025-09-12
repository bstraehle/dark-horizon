import { beforeEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import LeaderboardManager from "../js/managers/LeaderboardManager.js";

describe("LeaderboardManager remote save", () => {
  beforeEach(() => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "http://localhost/",
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.localStorage = dom.window.localStorage;
  });

  it("persists server-returned payload and emits event", async () => {
    const serverPayload = {
      scores: [
        { id: "XYZ", score: 999 },
        { id: "ABC", score: 100 },
      ],
    };

    // Mock fetch to respond to PUT with 200 and the payload
    globalThis.fetch = async (_url, _opts) => {
      return {
        ok: true,
        json: async () => serverPayload,
      };
    };

    let eventDetail = null;
    window.addEventListener("leaderboard:updated", (e) => {
      eventDetail = e.detail;
    });

    const entries = [{ id: "XYZ", score: 999 }];
    const res = await LeaderboardManager.save(entries, { remote: true });
    expect(res).toBeTruthy();

    const raw = localStorage.getItem(LeaderboardManager.KEY_LEADERBOARD);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    // Normalize check: first entry present and scores match server payload order
    expect(parsed[0].id).toBe(String(serverPayload.scores[0].id));
    expect(parsed[0].score).toBe(Number(serverPayload.scores[0].score));

    // Event dispatched with normalized entries
    expect(eventDetail).not.toBeNull();
    expect(Array.isArray(eventDetail)).toBe(true);
    expect(eventDetail[0].id).toBe(parsed[0].id);
  });
});
