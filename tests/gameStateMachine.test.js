// @ts-check
import { describe, it, expect } from "vitest";
import { GameStateMachine } from "../js/core/GameStateMachine.js";

describe("GameStateMachine", () => {
  it("starts from menu and transitions correctly", () => {
    const sm = new GameStateMachine();
    expect(sm.isMenu()).toBe(true);
    expect(sm.isRunning()).toBe(false);

    sm.start();
    expect(sm.isRunning()).toBe(true);
    expect(sm.isPaused()).toBe(false);

    sm.pause();
    expect(sm.isPaused()).toBe(true);
    expect(sm.isRunning()).toBe(false);

    sm.resume();
    expect(sm.isRunning()).toBe(true);

    sm.end();
    expect(sm.isGameOver()).toBe(true);
  });
});
