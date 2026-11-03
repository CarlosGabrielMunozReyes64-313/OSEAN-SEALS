import { fitMenu } from '../menuLayout';
import { Scene } from 'phaser';
import { SHEET } from '../objects/Player';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        fitMenu(this, this.add.image(512, 384, 'background'));

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('barra-chat', 'ui/barra-chat.png');
        for (const key of ['marco-preview', 'ventana', 'casilla', 'casilla-seleccionada', 'boton', 'boton-cerrar', 'icono-camisa', 'icono-check']) {
            this.load.image(key, 'ui/' + key + '.png');
        }
        // Vite detecta las dos hojas al arrancar o compilar el proyecto.
        const archivos = Object.keys(import.meta.glob('/public/assets/foca/foca-*.png'));
        if (['cuerpo', 'detalles'].every(k => archivos.includes('/public/assets/foca/foca-' + k + '.png'))) {
            for (const k of ['cuerpo', 'detalles']) {
                this.load.spritesheet(k, 'foca/foca-' + k + '.png', { frameWidth: SHEET.width, frameHeight: SHEET.height });
            }
        }
        // Phaser separa la hoja en cuadros del mismo tamaño.
        if (SHEET.file) {
            this.load.spritesheet('foca', SHEET.file, { frameWidth: SHEET.width, frameHeight: SHEET.height });
        }
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Acceso');
    }
}
