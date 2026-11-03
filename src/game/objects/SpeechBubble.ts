import { GameObjects, Scene } from 'phaser';

export class SpeechBubble extends GameObjects.Container {
    constructor(scene: Scene, owner: GameObjects.Sprite, text: string) {
        super(scene);
        scene.add.existing(this);
        const label = scene.add.text(0, 0, text, {
            fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#192539',
            align: 'center', wordWrap: { width: 176, useAdvancedWrap: true }
        });
        const width = label.width + 24;
        const height = label.height + 16;
        const shape = scene.add.graphics().fillStyle(0xffffff);
        shape.fillRoundedRect(-width / 2, -height - 8, width, height, 12);
        shape.fillTriangle(-7, -9, 7, -9, 0, 0);
        label.setOrigin(0.5, 1).setPosition(0, -16);
        this.add([shape, label]);
        this.setDepth(owner.depth + 1);

        // La punta queda anclada al borde superior de esta foca.
        const follow = () => this.setPosition(owner.x, owner.getTopCenter().y - 2);
        follow();
        scene.events.on('postupdate', follow);
        scene.tweens.add({
            targets: this, alpha: 0, delay: 5000, duration: 350,
            onComplete: () => this.destroy()
        });
        this.once('destroy', () => {
            scene.events.off('postupdate', follow);
            scene.tweens.killTweensOf(this);
        });
    }
}
