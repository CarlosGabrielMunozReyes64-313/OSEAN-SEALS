import { GameObjects, Scene } from 'phaser';

export class ChatBar {
    private readonly input = document.createElement('input');
    private readonly bar: GameObjects.DOMElement;

    setDisponible(disponible: boolean) {
        this.input.disabled = !disponible;
        if (!disponible) this.input.blur();
        this.bar.setVisible(disponible);
    }

    get editing() {
        return document.activeElement === this.input;
    }

    constructor(scene: Scene, send: (text: string) => void, pause: () => void) {
        const root = document.createElement('div');
        // El marco y el campo comparten la misma caja DOM.
        const frame = document.createElement('img');
        frame.src = import.meta.env.BASE_URL + 'assets/ui/barra-chat.png';
        frame.alt = '';
        frame.draggable = false;
        Object.assign(frame.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
        root.appendChild(frame);
        root.style.cursor = 'text';

        // Las medidas son porcentajes de la imagen de 800 × 92.
        const field = this.input;
        field.type = 'text';
        field.className = 'phaser-chat-input';
        field.placeholder = 'Escribe un mensaje...';
        field.setAttribute('aria-label', 'Mensaje del chat');
        field.enterKeyHint = 'send';
        field.maxLength = 50;
        field.autocomplete = 'off';
        Object.assign(field.style, {
            position: 'absolute', left: '4.25%', top: '27.17%', width: '91.625%',
            height: '50%', boxSizing: 'border-box', border: 'none', outline: 'none',
            padding: '0 6px', background: 'transparent', color: '#fff1cc',
            caretColor: '#ffe099', fontFamily: 'system-ui, sans-serif'
        });
        root.appendChild(field);
        this.bar = scene.add.dom(0, 0, root).setOrigin(0).setScrollFactor(0).setDepth(10000);
        this.bar.pointerEvents = 'auto';

        const layout = () => {
            const width = Math.min(800, Math.max(1, scene.scale.width - 74));
            const height = width * 92 / 800;
            root.style.width = width + 'px';
            root.style.height = height + 'px';
            field.style.fontSize = Math.min(20, Math.max(14, height * 0.42)) + 'px';
            this.bar.updateSize();
            this.bar.setPosition((scene.scale.width - width - 56) / 2, scene.scale.height - height - 8);
        };
        layout();
        scene.scale.on('resize', layout);
        root.addEventListener('pointerdown', event => {
            event.stopPropagation();
            field.focus();
        });
        field.addEventListener('focus', pause);
        field.addEventListener('blur', () => { field.value = ''; });
        field.addEventListener('keyup', event => event.stopPropagation());
        field.addEventListener('keydown', event => {
            // Las flechas editan texto. El navegador conserva tildes, ñ y pegado.
            event.stopPropagation();
            if (event.isComposing || event.keyCode === 229) return;
            if (event.key !== 'Enter' && event.key !== 'Escape') return;
            event.preventDefault();
            if (event.repeat) return;
            const text = field.value.trim();
            if (event.key === 'Enter' && text) send(text);
            field.blur();
        });
        const open = (event: KeyboardEvent) => {
            if (!field.disabled && event.key === 'Enter' && !event.repeat && !event.isComposing && !this.editing) {
                event.preventDefault();
                field.focus();
            }
        };
        window.addEventListener('keydown', open);
        scene.events.once('shutdown', () => {
            window.removeEventListener('keydown', open);
            scene.scale.off('resize', layout);
            this.bar.destroy();
        });
    }
}
