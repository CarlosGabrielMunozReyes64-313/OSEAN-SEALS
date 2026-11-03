import { colores, GRIS } from '../config/colores';
const clave = 'ocean-seals.color';
// Si el navegador bloquea el almacenamiento, se puede seguir jugando.
export function guardarColor(color: number) {
    try { localStorage.setItem(clave, String(color)); } catch { /* Solo durante la sesión. */ }
}
export function cargarColor(): number {
    try {
        const valor = Number(localStorage.getItem(clave));
        return colores.find(c => !c.bloqueado && c.valor === valor)?.valor ?? GRIS;
    } catch { return GRIS; }
}
