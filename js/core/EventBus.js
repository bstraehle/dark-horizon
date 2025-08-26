/**
 * Tiny event bus for decoupling game systems.
 */
export class EventBus {
  /** Create a new EventBus. */
  constructor() {
    /** @type {Map<import('../types.js').GameEvent, Set<Function>>} */
    this._map = new Map();
  }

  /**
   * Subscribe a handler to an event type.
   * @param {import('../types.js').GameEvent} type
   * @param {(payload: any)=>void} handler
   * @returns {()=>void} Unsubscribe function
   */
  on(type, handler) {
    let set = this._map.get(type);
    if (!set) {
      set = new Set();
      this._map.set(type, set);
    }
    set.add(handler);
    return () => this.off(type, handler);
  }

  /**
   * Unsubscribe a handler from an event type.
   * @param {import('../types.js').GameEvent} type
   * @param {(payload: any)=>void} handler
   * @returns {void}
   */
  off(type, handler) {
    const set = this._map.get(type);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this._map.delete(type);
  }

  /**
   * Emit an event to all subscribed handlers.
   * @param {import('../types.js').GameEvent} type
   * @param {any} payload
   * @returns {void}
   */
  emit(type, payload) {
    const set = this._map.get(type);
    if (!set || set.size === 0) return;
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch (_) {
        /* ignore handler errors */
      }
    }
  }

  /**
   * Clear handlers for a specific type or all handlers when omitted.
   * @param {import('../types.js').GameEvent=} type
   * @returns {void}
   */
  clear(type) {
    if (typeof type === "string") {
      this._map.delete(type);
      return;
    }
    this._map.clear();
  }
}
