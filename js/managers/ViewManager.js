import { CONFIG, clamp } from '../constants.js';

/**
 * ViewManager centralizes canvas sizing and device pixel ratio transforms.
 */
export class ViewManager {
    /**
     * Resize canvas and update view metrics and player spawn position.
     * @param {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, view: {width:number,height:number,dpr:number}, player: { x:number,y:number,width:number,height:number}, canvasRect?: DOMRect, gameRunning?: boolean }} game - The game instance.
     */
    static resize(game) {
        const { canvas, ctx, view, player } = game;
        const wasRunning = !!game.gameRunning;
        const prevW = view.width || 0;
        const prevH = view.height || 0;
        let relCenterX = 0.5;
        let relBottom = CONFIG.PLAYER.SPAWN_Y_OFFSET / Math.max(1, prevH);
        if (wasRunning && prevW > 0 && prevH > 0) {
            const centerX = player.x + player.width / 2;
            const bottomOffset = Math.max(0, prevH - (player.y + player.height));
            relCenterX = centerX / prevW;
            relBottom = bottomOffset / prevH;
        }
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        view.dpr = dpr;
        view.width = Math.floor(window.innerWidth);
        view.height = Math.floor(window.innerHeight);

        canvas.style.width = view.width + 'px';
        canvas.style.height = view.height + 'px';
        canvas.width = Math.floor(view.width * dpr);
        canvas.height = Math.floor(view.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (wasRunning && prevW > 0 && prevH > 0) {
            const newCenterX = relCenterX * view.width;
            const newBottom = relBottom * view.height;
            player.x = clamp(newCenterX - player.width / 2, 0, view.width - player.width);
            player.y = clamp(view.height - player.height - newBottom, 0, view.height - player.height);
        } else {
            player.x = view.width / 2 - player.width / 2;
            player.y = view.height - player.height - CONFIG.PLAYER.SPAWN_Y_OFFSET;
        }

        game.canvasRect = canvas.getBoundingClientRect();
    }
}
