// @ts-check
import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../js/core/EventBus.js";

describe("EventBus", () => {
  it("subscribes, emits, and unsubscribes", () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    const off1 = bus.on("test", h1);
    bus.on("test", h2);

    bus.emit("test", { a: 1 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    off1();
    bus.emit("test", { a: 2 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(2);

    bus.clear("test");
    bus.emit("test", { a: 3 });
    expect(h2).toHaveBeenCalledTimes(2);
  });
});
