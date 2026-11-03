import { Scene, GameObjects } from 'phaser';

// Los menús de la plantilla están dibujados alrededor del punto (512, 384).
export function fitMenu(scene: Scene, background: GameObjects.Image) {
    const layout = () => {
        const { width, height } = scene.scale;
        const zoom = Math.min(1, width / 560, height / 360);
        scene.cameras.main.setZoom(zoom).centerOn(512, 384);
        background.setScale(Math.max(width / background.width, height / background.height) / zoom);
    };
    layout();
    scene.scale.on('resize', layout);
    scene.events.once('shutdown', () => scene.scale.off('resize', layout));
}
