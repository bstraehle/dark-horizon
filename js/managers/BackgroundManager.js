import { CONFIG } from "../constants.js";
import { Background } from "../entities/Background.js";
import { Nebula } from "../entities/Nebula.js";
import { StarField } from "../entities/StarField.js";
/** @typedef {import('../types.js').RNGLike} RNGLike */

/**
 * BackgroundManager handles background initialization and drawing.
 */
export class BackgroundManager {
  /**
   * Initialize background components using a GameContext-like object.
   * @param {{ view:{width:number,height:number}, running:boolean, isMobile:boolean, rng?: RNGLike }} ctxObj
   * @returns {{ nebulaConfigs?: any, starField: any }}
   */
  static init(ctxObj) {
    const {
      view: { width, height },
      running,
      isMobile,
      rng,
    } = ctxObj;
    const state = {};
    if (running) {
      state.nebulaConfigs = Nebula.init(width, height, isMobile, rng);
    }
    state.starField = StarField.init(width, height, rng, isMobile);
    return state;
  }

  /**
   * Draw the background using a GameContext-like object.
   * @param {{ ctx: CanvasRenderingContext2D, view: {width:number,height:number}, running:boolean, paused:boolean, animTime:number, timeSec?:number, dtSec?:number, background:{nebulaConfigs?:any, starField:any}, rng?: RNGLike }} ctxObj
   */
  static draw(ctxObj) {
    const {
      ctx,
      view: { width, height },
      paused,
      animTime,
      background: { nebulaConfigs, starField },
    } = ctxObj;
    Background.draw(ctx, width, height);
    // Do not darken the background here; keep nebula brightness unchanged while paused.
    // Always draw nebula when available (even when paused or game over)
    if (nebulaConfigs) {
      Nebula.draw(ctx, nebulaConfigs);
    }
    const timeSec = typeof ctxObj.timeSec === "number" ? ctxObj.timeSec : (animTime || 0) / 1000;
    const dtSec = typeof ctxObj.dtSec === "number" ? ctxObj.dtSec : CONFIG.TIME.DEFAULT_DT;
    // Freeze stars while paused
    StarField.draw(ctx, width, height, starField, timeSec, paused, dtSec, ctxObj.rng);
  }
}
