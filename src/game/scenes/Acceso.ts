import { Scene } from 'phaser';
import { comprobarSesion, disponibilidad, iniciarSesion, mensaje, registrar } from '../red';
import './acceso.css';

export class Acceso extends Scene {
    constructor() { super('Acceso'); }

    async create(datos: { aviso?: string } = {}) {
        this.cameras.main.setBackgroundColor('#081c34');
        let vigente = true;
        let consulta: AbortController | undefined;
        let espera: number | undefined;
        this.events.once('shutdown', () => {
            vigente = false;
            window.clearTimeout(espera);
            consulta?.abort();
        });
        try {
            await comprobarSesion();
            if (vigente) this.scene.start('MainMenu');
            return;
        } catch { if (!vigente) return; }

        const marco = this.add.nineslice(0, 0, 'ventana', undefined, 400, 380, 34, 34, 34, 34);
        const form = document.createElement('form');
        form.className = 'acceso-foca';
        form.innerHTML = `<h1>Ocean-Seals</h1><label>Nombre de foca<input name="nombre" autocomplete="nickname" minlength="3" maxlength="16"></label>
        <small aria-live="polite"></small><label>Correo<input name="correo" type="email" autocomplete="email" maxlength="254" required></label>
        <label>Contraseña<input name="clave" type="password" maxlength="128" required></label>
        <button type="submit"></button><button type="button"></button><output aria-live="polite"></output>`;
        const campo = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
        const nombre = campo('nombre'), correo = campo('correo'), clave = campo('clave');
        const [enviar, cambiar] = form.querySelectorAll('button');
        const estado = form.querySelector('small')!;
        const aviso = form.querySelector('output')!;
        const dom = this.add.dom(0, 0, form);
        dom.pointerEvents = 'auto';
        let alta = false;
        let ocupado = false;
        const layout = () => {
            const { width, height } = this.scale;
            const w = Math.min(400, width - 8), h = Math.min(460, height - 8);
            marco.setPosition(width / 2, height / 2).setSize(w, h);
            form.style.width = Math.max(1, w - 36) + 'px';
            form.style.maxHeight = Math.max(1, h - 42) + 'px';
            dom.updateSize().setPosition(width / 2, height / 2);
        };
        const pintar = () => {
            nombre.parentElement!.hidden = !alta;
            nombre.disabled = !alta;
            nombre.required = alta;
            clave.autocomplete = alta ? 'new-password' : 'current-password';
            enviar.textContent = ocupado ? 'Conectando…' : alta ? 'Crear cuenta' : 'Iniciar sesión';
            enviar.disabled = cambiar.disabled = ocupado;
            cambiar.textContent = alta ? 'Ya tengo cuenta' : 'Crear una cuenta';
            layout();
        };
        cambiar.onclick = () => {
            alta = !alta;
            consulta?.abort();
            window.clearTimeout(espera);
            estado.textContent = aviso.textContent = clave.value = '';
            pintar();
        };
        nombre.oninput = () => {
            consulta?.abort();
            window.clearTimeout(espera);
            estado.textContent = '';
            const valor = nombre.value.trim();
            if (valor.length < 3) return;
            const controlador = new AbortController();
            consulta = controlador;
            espera = window.setTimeout(async () => {
                try {
                    const res = await disponibilidad(valor, controlador.signal);
                    if (!controlador.signal.aborted) estado.textContent = res.disponible ? 'Nombre disponible' : mensaje(new Error(res.motivo || 'nombre_ocupado'));
                } catch { if (!controlador.signal.aborted) estado.textContent = 'No se pudo comprobar el nombre.'; }
                if (vigente) layout();
            }, 400);
        };
        form.onsubmit = async event => {
            event.preventDefault();
            if (ocupado) return;
            ocupado = true;
            aviso.textContent = '';
            pintar();
            try {
                if (alta) await registrar(nombre.value.trim(), correo.value.trim(), clave.value);
                else await iniciarSesion(correo.value.trim(), clave.value);
                if (vigente) this.scene.start('MainMenu');
            } catch (error) {
                if (vigente) { ocupado = false; aviso.textContent = mensaje(error); pintar(); }
            }
        };
        aviso.textContent = datos.aviso ?? '';
        pintar();
        this.scale.on('resize', layout);
        this.events.once('shutdown', () => this.scale.off('resize', layout));
    }
}
