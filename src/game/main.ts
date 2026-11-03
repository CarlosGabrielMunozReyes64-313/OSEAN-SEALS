import { Acceso } from './scenes/Acceso';
import { VentanaColores } from './ui/VentanaColores';
import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    // Permite usar un campo HTML dentro del juego.
    dom: { createContainer: true },
    // El lienzo adopta las dimensiones reales de la pestaña.
    scale: { mode: Scale.RESIZE, expandParent: false },
    backgroundColor: '#028af8',
    // El mundo físico usa las dimensiones del juego.
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
    scene: [
        Boot,
        Preloader,
        Acceso,
        MainMenu,
        MainGame,
        GameOver,
        VentanaColores
    ]
};

const StartGame = (parent: string) => {
    const container = document.getElementById(parent)!;
    Object.assign(container.style, { position: 'fixed', inset: '0', overflow: 'hidden' });
    return new Game({ ...config, parent });
};

export default StartGame;
