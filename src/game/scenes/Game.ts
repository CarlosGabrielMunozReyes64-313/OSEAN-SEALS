import { cargarColor } from '../services/datosJugador';
import { ChatBar } from '../ui/ChatBar';
import { Scene, Input, Math as PhaserMath } from 'phaser';
import { Player, PLAYER_SPEED } from '../objects/Player';

export class Game extends Scene {
    private modal = false;
    private chat: ChatBar;
    private keys: Record<string, Input.Keyboard.Key>;
    private player: Player;
    private destination: PhaserMath.Vector2 | null = null;

    constructor() { super('Game'); }

    create() {
        const { width, height } = this.scale;
        const background = this.add.image(0, 0, 'background').setAlpha(0.5);
        this.add.text(20, 16, 'Clic o WASD para caminar · Enter para hablar');
        this.player = new Player(this, width / 2, height / 2);
        this.destination = null;
        const keyboard = this.input.keyboard!;
        this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
        this.chat = new ChatBar(this, text => this.player.say(text), () => {
            // Al empezar a escribir se cancela también el recorrido por clic.
            keyboard.resetKeys();
            this.destination = null;
            this.player.move(0, 0);
        });
        this.player.setColor(cargarColor());
        this.scene.launch('VentanaColores', {
            player: this.player, chat: this.chat,
            bloquear: (valor: boolean) => {
                this.modal = valor;
                keyboard.resetKeys();
                this.destination = null;
                this.player.move(0, 0);
            }
        });
        this.events.once('shutdown', () => this.scene.stop('VentanaColores'));
        const layout = () => {
            const { width, height } = this.scale;
            background.setPosition(width / 2, height / 2)
                .setScale(Math.max(width / background.width, height / background.height));
            this.physics.world.setBounds(0, 0, width, height);
            const position = this.limitPoint(new PhaserMath.Vector2(this.player.x, this.player.y));
            this.player.body!.reset(position.x, position.y);
            if (this.destination) this.limitPoint(this.destination);
        };
        layout();
        this.scale.on('resize', layout);
        this.events.once('shutdown', () => this.scale.off('resize', layout));
        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (this.modal || this.chat.editing || pointer.button !== 0) return;
            const point = pointer.positionToCamera(this.cameras.main) as PhaserMath.Vector2;
            this.destination = this.limitPoint(point);
        });
    }

    // Usa siempre el tamaño actual, incluso si la ventana cambió durante la marcha.
    private limitPoint(point: PhaserMath.Vector2) {
        const { width, height } = this.scale;
        const marginX = Math.min(this.player.displayWidth, width) / 2;
        const marginY = Math.min(this.player.displayHeight, height) / 2;
        return point.set(
            PhaserMath.Clamp(point.x, marginX, width - marginX),
            PhaserMath.Clamp(point.y, marginY, height - marginY)
        );
    }

    update() {
        if (this.modal || this.chat.editing) return;
        const k = this.keys;
        const x = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
        const y = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
        if (x || y) this.destination = null;
        if (!this.destination) {
            this.player.move(x, y);
            return;
        }

        const dx = this.destination.x - this.player.x;
        const dy = this.destination.y - this.player.y;
        // Si falta como máximo un paso físico, terminamos justo en el punto.
        if (Math.hypot(dx, dy) <= PLAYER_SPEED / this.physics.world.fps) {
            this.player.setPosition(this.destination.x, this.destination.y);
            this.player.body!.reset(this.player.x, this.player.y);
            this.destination = null;
            this.player.move(0, 0);
        } else {
            this.player.move(dx, dy);
        }
    }
}
