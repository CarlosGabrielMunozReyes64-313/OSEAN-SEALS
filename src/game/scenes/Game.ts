import { Scene, Input, Math as M } from 'phaser';
import { Callbacks } from '@colyseus/sdk';
import { Player, PLAYER_SPEED } from '../objects/Player';
import { entrarPlaza, cerrarSesion, codigo, mensaje, type Sala, type Jugador, type Chat, type Expulsion } from '../red';
import { perfil } from '../services/datosJugador';

const ANCHO = 1280, ALTO = 720;

export class Game extends Scene {
    private sala?: Sala;
    private local?: Player;
    private focas = new Map<string, { sprite: Player; estado: Jugador }>();
    private keys!: Record<string, Input.Keyboard.Key>;
    private destino?: M.Vector2;
    private modal = false;
    private conectada = false;
    private andando = false;
    private ultimoEnvio = 0;

    constructor() { super('Game'); }
    create() {
        let vigente = true;
        this.modal = this.conectada = this.andando = false;
        this.ultimoEnvio = 0;
        this.destino = undefined;
        const fondo = this.add.image(ANCHO / 2, ALTO / 2, 'background').setDisplaySize(ANCHO, ALTO);
        this.physics.world.setBounds(0, 0, ANCHO, ALTO);
        const ajustar = () => {
            const { width, height } = this.scale;
            this.cameras.main.setZoom(Math.min(width / ANCHO, height / ALTO)).centerOn(fondo.x, fondo.y);
        };
        ajustar();
        this.scale.on('resize', ajustar);
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as typeof this.keys;
        this.input.on('pointerdown', (p: Input.Pointer) => {
            if (!this.puedeCaminar() || p.button !== 0 || !this.local) return;
            const punto = p.positionToCamera(this.cameras.main) as M.Vector2;
            const mx = this.local.displayWidth / 2, my = this.local.displayHeight / 2;
            this.destino = punto.set(M.Clamp(punto.x, mx, ANCHO - mx), M.Clamp(punto.y, my, ALTO - my));
        });

        // Este aviso pertenece a la pantalla y no a la cámara del mundo.
        const aviso = document.createElement('div');
        aviso.className = 'aviso-plaza';
        const texto = document.createElement('span'), boton = document.createElement('button');
        aviso.append(texto, boton);
        this.game.canvas.parentElement!.appendChild(aviso);
        const informar = (msg: string, accion?: string) => {
            aviso.hidden = !msg;
            texto.textContent = msg;
            boton.hidden = !accion;
            boton.textContent = accion ?? '';
        };
        boton.onclick = () => { boton.disabled = true; this.scene.restart(); };
        informar('Entrando a la plaza…');
        const salir = () => { const sala = this.sala; this.sala = undefined; if (sala) void sala.leave().catch(() => {}); };
        window.addEventListener('pagehide', salir);
        this.events.once('shutdown', () => {
            vigente = false;
            salir();
            this.scene.stop('VentanaColores');
            this.local = undefined;
            this.focas.clear();
            aviso.remove();
            this.scale.off('resize', ajustar);
            window.removeEventListener('pagehide', salir);
        });
        const conectar = async () => {
            try {
                const sala = await entrarPlaza();
                if (!vigente) { void sala.leave(); return; }
                this.sala = sala;
                const actual = () => vigente && this.sala === sala;
                const conexion = (activa: boolean) => {
                    this.conectada = activa;
                    this.detener();
                    this.scene.get('VentanaColores').events.emit('conexion', activa);
                };
                this.conectada = true;
                sala.onDrop(() => { if (actual()) { conexion(false); informar('Reconectando…'); } });
                sala.onReconnect(() => { if (actual()) { conexion(true); informar(this.local ? '' : 'Entrando a la plaza…'); } });
                sala.onLeave(() => {
                    if (!actual()) return;
                    conexion(false);
                    this.sala = undefined;
                    informar('Se cerró la conexión con la plaza.', 'Volver a entrar');
                });
                sala.onMessage('expulsado', (m: Expulsion) => {
                    if (actual() && m.motivo === 'sesion_duplicada') {
                        conexion(false);
                        this.scene.start('MainMenu', { aviso: 'Entraste con tu cuenta desde otra ventana' });
                    }
                });
                sala.onMessage('chat', (m: Chat) => { if (actual()) this.focas.get(m.sessionId)?.sprite.say(m.texto); });

                const cb = Callbacks.get(sala);
                cb.onAdd('jugadores', (estado, id) => {
                    if (!actual()) return;
                    const propia = id === sala.sessionId;
                    const sprite = new Player(this, estado.x, estado.y, estado.nombre, propia);
                    sprite.setColor(estado.color);
                    sprite.animar(estado.direccion, false);
                    this.focas.set(id, { sprite, estado });
                    if (propia) {
                        this.local = sprite;
                        if (perfil) perfil.color = estado.color;
                        informar('');
                        this.scene.launch('VentanaColores', {
                            player: sprite, conectado: () => this.conectada,
                            pausa: () => this.detener(),
                            bloquear: (v: boolean) => { this.modal = v; this.detener(); },
                            enviarChat: (texto: string) => { if (this.conectada) sala.send('chat', texto); },
                            enviarColor: (color: number) => { if (this.conectada) sala.send('color', color); }
                        });
                    }
                    cb.onChange(estado, () => {
                        if (!actual() || !sprite.active) return;
                        sprite.setColor(estado.color);
                        if (!propia) return;
                        if (perfil) perfil.color = estado.color;
                        if (Math.hypot(sprite.x - estado.x, sprite.y - estado.y) > 40) {
                            sprite.body!.reset(estado.x, estado.y);
                        }
                    });
                });
                cb.onRemove('jugadores', (_, id) => {
                    if (!actual()) return;
                    this.focas.get(id)?.sprite.destroy();
                    this.focas.delete(id);
                    if (id === sala.sessionId) this.local = undefined;
                });
            } catch (error) {
                if (!vigente) return;
                if (['sesion_requerida', 'sesion_invalida', 'cuenta_suspendida'].includes(codigo(error))) {
                    await cerrarSesion();
                    if (vigente) this.scene.start('Acceso', { aviso: mensaje(error) });
                } else informar(mensaje(error), 'Reintentar');
            }
        };
        void conectar();
    }

    private puedeCaminar() {
        return this.conectada && !this.modal && !(document.activeElement instanceof HTMLInputElement);
    }
    private detener() {
        this.destino = undefined;
        this.input.keyboard?.resetKeys();
        this.local?.move(0, 0);
        this.transmitir(false, this.time.now);
    }
    private transmitir(marcha: boolean, ahora: number) {
        if (this.local && this.conectada && ((marcha && ahora - this.ultimoEnvio >= 100) || (!marcha && this.andando))) {
            const { x, y, direccion } = this.local;
            this.sala?.send('mover', { x, y, direccion });
            this.ultimoEnvio = ahora;
        }
        this.andando = marcha;
    }
    update(ahora: number, delta: number) {
        if (!this.conectada) return;
        // Las remotas solo dibujan la réplica del servidor, sin cuerpos físicos.
        for (const { sprite, estado } of this.focas.values()) {
            if (sprite === this.local) continue;
            const dx = estado.x - sprite.x, dy = estado.y - sprite.y;
            const distancia = Math.hypot(dx, dy);
            const factor = distancia < 0.5 ? 1 : 1 - Math.exp(-delta / 65);
            sprite.setPosition(sprite.x + dx * factor, sprite.y + dy * factor);
            sprite.animar(estado.direccion, distancia >= 0.5);
        }
        if (!this.local || !this.puedeCaminar()) return;
        const k = this.keys;
        let x = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
        let y = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
        if (x || y) this.destino = undefined;
        if (this.destino) {
            x = this.destino.x - this.local.x; y = this.destino.y - this.local.y;
            if (Math.hypot(x, y) <= PLAYER_SPEED / this.physics.world.fps) {
                this.local.body!.reset(this.destino.x, this.destino.y);
                this.destino = undefined; x = y = 0;
            }
        }
        this.local.move(x, y);
        this.transmitir(!!(x || y), ahora);
    }
}
