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
   * Resize existing background state to match new canvas dimensions.
   * If no prior state exists, return null to indicate caller should init.
   * @param {{ view:{width:number,height:number}, running:boolean, isMobile:boolean, rng?: RNGLike, background?:{nebulaConfigs?:any, starField:any} }} ctxObj
   * @param {{width:number,height:number}} prevView
   * @returns {{ nebulaConfigs?: any, starField?: any } | null}
   */
  static resize(ctxObj, prevView) {
    const { view, background } = ctxObj;
    if (!view || !prevView) return null;
    const prevW = prevView.width || 0;
    const prevH = prevView.height || 0;
    const newW = view.width || 0;
    const newH = view.height || 0;
    if (!background) return null;
    const out = {};
    // Scale nebula positions and radii proportionally when present
    if (background.nebulaConfigs) {
      try {
        out.nebulaConfigs = Nebula.resize(background.nebulaConfigs, prevW, prevH, newW, newH);
      } catch (_e) {
        out.nebulaConfigs = background.nebulaConfigs;
      }
    }
    if (background.starField) {
      try {
        out.starField = StarField.resize(background.starField, prevW, prevH, newW, newH);
      } catch (_e) {
        out.starField = background.starField;
      }
    }
    return out;
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
    // Only draw nebula during active gameplay. This prevents nebula from
    // appearing on the start/menu screens or when the game is paused/game over.
    if (nebulaConfigs && ctxObj.running) {
      Nebula.draw(ctx, nebulaConfigs);
    }
    const timeSec = typeof ctxObj.timeSec === "number" ? ctxObj.timeSec : (animTime || 0) / 1000;
    const dtSec = typeof ctxObj.dtSec === "number" ? ctxObj.dtSec : CONFIG.TIME.DEFAULT_DT;
    // Freeze stars while paused
    StarField.draw(ctx, width, height, starField, timeSec, paused, dtSec, ctxObj.rng);
  }
}
