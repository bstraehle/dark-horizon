// @ts-check
import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../js/core/EventBus.js";

describe("EventBus edge cases", () => {
  it("allows a handler to unsubscribe another during emit", () => {
    const bus = new EventBus();
    let off2;
    const h1 = vi.fn(() => {
      if (off2) off2();
    });
    const h2 = vi.fn();

    bus.on("ev", h1);
    off2 = bus.on("ev", h2);

    // First emit: both are called, handler h1 unsubscribes h2 during emit
    bus.emit("ev", { a: 1 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    // Second emit: h2 should no longer be called
    bus.emit("ev", { a: 2 });
    expect(h1).toHaveBeenCalledTimes(2);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("continues emitting other handlers when one throws", () => {
    const bus = new EventBus();
    const throwing = vi.fn(() => {
      throw new Error("boom");
    });
    const safe = vi.fn();

    bus.on("err", throwing);
    bus.on("err", safe);

    // Should not throw, and the safe handler must still be invoked.
    expect(() => bus.emit("err", {})).not.toThrow();
    expect(throwing).toHaveBeenCalledTimes(1);
    expect(safe).toHaveBeenCalledTimes(1);
  });
});
