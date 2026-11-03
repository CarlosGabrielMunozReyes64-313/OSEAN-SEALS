import { GRIS } from '../config/colores';
import { SpeechBubble } from './SpeechBubble';
import { Math as PhaserMath, Physics, Scene } from 'phaser';

export const PLAYER_SPEED = 220; // Píxeles por segundo.
export const SHEET = {
    // Usa null para probar los controles con un rectángulo.
    file: 'foca/foca.png' as string | null,
    width: 96,
    height: 96,
    framesPerRow: 4
};
const rows = { derecha: 0, abajo: 1, arriba: 2, izquierda: 3 };
type Direction = keyof typeof rows;

export class Player extends Physics.Arcade.Sprite {
    private bubble?: SpeechBubble;
    private color = GRIS;
    private facing: Direction = 'abajo';
    private readonly motion = new PhaserMath.Vector2();

    constructor(scene: Scene, x: number, y: number) {
        const layered = scene.textures.exists('cuerpo') && scene.textures.exists('detalles');
        const hasSheet = !!SHEET.file && scene.textures.exists('foca');
        super(scene, x, y, layered ? 'cuerpo' : hasSheet ? 'foca' : '__WHITE');
        scene.add.existing(this);
        if (layered || hasSheet) {
            this.setFrame(rows.abajo * SHEET.framesPerRow);
            for (const [direction, row] of Object.entries(rows)) {
                const key = 'foca-' + direction;
                if (scene.anims.exists(key)) continue;
                const start = row * SHEET.framesPerRow;
                scene.anims.create({
                    key, frameRate: 8, repeat: -1,
                    frames: scene.anims.generateFrameNumbers(this.texture.key, {
                        start, end: start + SHEET.framesPerRow - 1
                    })
                });
            }
        } else {
            this.setDisplaySize(42, 32).setTint(0xffcb55);
        }
        if (layered) {
            const details = scene.add.image(x, y, 'detalles', this.frame.name);
            // Una sola animación. El dibujo superior copia el cuadro definitivo antes de renderizar.
            const group = scene.add.layer([this, details]);
            const sync = () => {
                details.setPosition(this.x, this.y).setScale(this.scaleX, this.scaleY)
                    .setFlip(this.flipX, this.flipY).setFrame(this.frame.name);
                group.setDepth(this.depth);
            };
            scene.events.on('prerender', sync);
            this.once('destroy', () => {
                scene.events.off('prerender', sync);
                group.remove(this);
                group.destroy();
            });
        }
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.once('destroy', () => this.bubble?.destroy());
    }

    setColor(color: number) {
        this.color = color;
        if (color === GRIS) this.clearTint();
        else this.setTint(color);
    }
    getColor() { return this.color; }

    // También sirve para un jugador remoto cuando se conecte el multijugador.
    say(texto: string) {
        if (!texto.trim()) return;
        this.bubble?.destroy();
        const bubble = new SpeechBubble(this.scene, this, texto);
        this.bubble = bubble;
        bubble.once('destroy', () => { this.bubble = undefined; });
    }

    // Recibe una intención de movimiento, venga del teclado o de otro jugador.
    move(x: number, y: number) {
        this.motion.set(x, y).normalize().scale(PLAYER_SPEED);
        this.setVelocity(this.motion.x, this.motion.y);
        if (x === 0 && y === 0) {
            if (this.texture.key !== '__WHITE') {
                this.anims.stop();
                this.setFrame(rows[this.facing] * SHEET.framesPerRow);
            }
            return;
        }
        // Miramos hacia el eje dominante del recorrido; en un empate usamos el perfil.
        this.facing = Math.abs(x) >= Math.abs(y)
            ? (x < 0 ? 'izquierda' : 'derecha')
            : (y < 0 ? 'arriba' : 'abajo');
        if (this.texture.key !== '__WHITE') this.play('foca-' + this.facing, true);
    }
}
