import { Scene } from 'phaser';
import { fitMenu } from '../menuLayout';
import { perfil } from '../services/datosJugador';
import { cerrarSesion, mensaje } from '../red';

export class MainMenu extends Scene {
    constructor() { super('MainMenu'); }
    create(datos: { aviso?: string } = {}) {
        if (!perfil) { this.scene.start('Acceso'); return; }
        fitMenu(this, this.add.image(512, 384, 'background'));
        const texto = (y: number, valor: string) => this.add.text(512, y, valor, {
            fontSize: '22px', align: 'center', backgroundColor: '#102944',
            padding: { x: 12, y: 8 }, wordWrap: { width: 475 }
        }).setOrigin(0.5);
        texto(274, '¡Hola, ' + perfil.nombre + '!');
        const entrar = texto(352, 'Entrar a la plaza').setInteractive({ useHandCursor: true });
        const salir = texto(410, 'Cerrar sesión').setInteractive({ useHandCursor: true });
        const aviso = texto(485, datos.aviso ?? '').setVisible(!!datos.aviso);
        entrar.on('pointerup', () => this.scene.start('Game'));
        salir.on('pointerup', async () => {
            entrar.disableInteractive(); salir.disableInteractive();
            try { await cerrarSesion(); this.scene.start('Acceso'); }
            catch (error) { aviso.setText(mensaje(error)).setVisible(true); entrar.setInteractive(); salir.setInteractive(); }
        });
    }
}
