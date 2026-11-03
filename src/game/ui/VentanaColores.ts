import { Scene, GameObjects } from 'phaser';
import { colores, GRIS } from '../config/colores';
import { Player, SHEET } from '../objects/Player';

import { ChatBar } from './ChatBar';

interface Datos { player: Player; enviarChat: (texto: string) => void; enviarColor: (color: number) => void; pausa: () => void; conectado: () => boolean; bloquear: (valor: boolean) => void }

// Escena de interfaz: su cámara permanece fija aunque se mueva la del mundo.
export class VentanaColores extends Scene {
    constructor() { super('VentanaColores'); }

    create({ player, enviarChat, enviarColor, pausa, conectado, bloquear }: Datos) {
        const chat = new ChatBar(this, enviarChat, pausa);
        this.events.on('conexion', (activa: boolean) => {
            chat.setDisponible(activa && !panel.visible);
        });
        this.events.once('shutdown', () => this.events.off('conexion'));
        const boton = this.add.image(0, 0, 'boton').setDisplaySize(48, 48).setTint(0xe4e4e4)
            .setInteractive({ useHandCursor: true });
        const camisa = this.add.image(0, 0, 'icono-camisa').setDisplaySize(30, 26);
        const fondo = this.add.rectangle(0, 0, 1, 1, 0x081427, 0.65).setOrigin(0).setInteractive();
        const panel = this.add.container();
        const marco = this.add.nineslice(0, 0, 'ventana', undefined, 470, 290, 34, 34, 34, 34);
        panel.add(marco);
        const titulo = this.add.text(0, -115, 'Colores', { fontSize: '26px', color: '#ffeab3' }).setOrigin(0.5);
        panel.add(titulo);
        const cerrar = this.add.image(193, -108, 'boton-cerrar').setDisplaySize(34, 34).setInteractive({ useHandCursor: true });
        panel.add(cerrar);
        const confirmar = this.add.image(155, 100, 'icono-check').setDisplaySize(42, 34).setInteractive({ useHandCursor: true });
        panel.add(confirmar);

        // La fila de frente es la segunda. Su primer cuadro es el número 4.
        const frame = SHEET.framesPerRow;
        // Marco de la tarjeta de referencia detrás de la vista previa.
        panel.add(this.add.nineslice(-110, 4, 'marco-preview', undefined, 184, 166, 14, 14, 14, 14));
        const preview = this.add.image(-110, 4, player.texture.key, player.texture.key === '__WHITE' ? undefined : frame)
            .setDisplaySize(150, 150);
        panel.add(preview);
        if (player.texture.key === 'cuerpo') {
            panel.add(this.add.image(-110, 4, 'detalles', frame).setDisplaySize(150, 150));
        }
        const nombre = this.add.text(-110, 98, '', { fontSize: '17px', color: '#fff1cf' }).setOrigin(0.5);
        panel.add(nombre);
        const celdas: GameObjects.Image[] = [];
        let seleccionado = player.getColor();
        const elegir = (valor: number) => {
            seleccionado = valor;
            if (valor === GRIS) preview.clearTint();
            else preview.setTint(valor);
            nombre.setText(colores.find(c => c.valor === valor)?.nombre ?? '');
            celdas.forEach((celda, i) => celda.setTexture(colores[i].valor === valor ? 'casilla-seleccionada' : 'casilla').setDisplaySize(43, 43));
        };
        colores.forEach((color, i) => {
            const x = 18 + (i % 4) * 48;
            const y = -56 + Math.floor(i / 4) * 49;
            const tile = this.add.image(x, y, 'casilla').setDisplaySize(43, 43);
            panel.add(tile);
            celdas.push(tile);
            panel.add(this.add.circle(x, y, 12, color.valor === GRIS ? 0xbab9b7 : color.valor));
            if (!color.bloqueado) tile.setInteractive({ useHandCursor: true }).on('pointerdown', () => elegir(color.valor));
            else tile.setAlpha(0.5);
        });


        const mostrar = (visible: boolean) => {
            panel.setVisible(visible);
            fondo.setVisible(visible);
            fondo.input!.enabled = visible;
            boton.setVisible(!visible);
            camisa.setVisible(!visible);
            boton.input!.enabled = !visible;
            chat.setDisponible(!visible && conectado());
            bloquear(visible);
        };
        const salir = (guardar: boolean) => {
            if (!panel.visible) return;
            if (guardar && conectado()) enviarColor(seleccionado);
            mostrar(false);
        };
        boton.on('pointerover', () => boton.clearTint());
        boton.on('pointerout', () => boton.setTint(0xe4e4e4));
        boton.on('pointerdown', () => boton.setTint(0x989898));
        boton.on('pointerup', () => {
            if (!conectado()) return;
            elegir(player.getColor());
            mostrar(true);
        });
        confirmar.on('pointerdown', () => salir(true));
        cerrar.on('pointerdown', () => salir(false));
        this.input.keyboard?.on('keydown-ESC', () => salir(false));

        const layout = () => {
            const { width, height } = this.scale;
            const barWidth = Math.min(800, Math.max(1, width - 74));
            boton.setPosition((width + barWidth + 8) / 2, height - 8 - Math.max(24, barWidth * 92 / 1600));
            camisa.setPosition(boton.x, boton.y);
            fondo.setSize(width, height);
            fondo.input!.hitArea.setSize(width, height);
            panel.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 12) / 470, (height - 12) / 290));
        };
        layout();
        mostrar(false);
        this.scale.on('resize', layout);
        this.events.once('shutdown', () => this.scale.off('resize', layout));
    }
}
