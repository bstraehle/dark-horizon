// @ts-check
import { describe, it, expect } from 'vitest';
import { Player } from '../js/entities/Player.js';
import { CONFIG } from '../js/constants.js';

/** Simple view helper */
const view = (w, h) => ({ width: w, height: h });

describe('Player.update', () => {
  it('moves with keyboard and clamps to view', () => {
    const p = new Player(0, 0, CONFIG.SIZES.PLAYER, CONFIG.SIZES.PLAYER, CONFIG.SPEEDS.PLAYER);
    const keys = { KeyD: true };
    const v = view(200, 200);

    // Move for 0.5s to the right
    p.update(keys, { x: 0, y: 0 }, v, 0.5);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBe(0);

    // Force left beyond 0 and ensure clamp
    keys.KeyD = false;
    keys.KeyA = true;
    p.x = 1;
    p.update(keys, { x: 0, y: 0 }, v, 1);
    expect(p.x).toBeGreaterThanOrEqual(0);
  });

  it('follows mouse when no keys are pressed (lerp hits target at dt>=~0.167)', () => {
    const p = new Player(10, 10, 20, 20, CONFIG.SPEEDS.PLAYER);
    const v = view(400, 400);
    const target = { x: 200, y: 100 };

    // dtSec = 1 -> lerp factor min(1, 6*1) => 1, reaches target-ship-center instantly
    p.update({}, target, v, 1);
    expect(Math.abs(p.x - (target.x - p.width / 2))).toBeLessThan(1e-6);
    expect(Math.abs(p.y - (target.y - p.height / 2))).toBeLessThan(1e-6);
  });
});
