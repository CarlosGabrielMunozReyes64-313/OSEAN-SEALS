export interface ColorFoca { nombre: string; valor: number; bloqueado?: boolean }
// Blanco significa «sin tinte». El círculo de la interfaz sí se dibuja gris.
export const GRIS = 0xffffff;
export const colores: ColorFoca[] = [
    { nombre: 'Gris original', valor: GRIS },
    { nombre: 'Azul', valor: 0x4275ed },
    { nombre: 'Celeste', valor: 0x94d9ff },
    { nombre: 'Turquesa', valor: 0x47dace },
    { nombre: 'Verde', valor: 0x75c55a },
    { nombre: 'Amarillo', valor: 0xffdf60 },
    { nombre: 'Naranja', valor: 0xff9847 },
    { nombre: 'Rojo', valor: 0xef5658 },
    { nombre: 'Rosa', valor: 0xff9bc6 },
    { nombre: 'Morado', valor: 0xac79e7 },
    { nombre: 'Café', valor: 0xad7858 },
    { nombre: 'Negro', valor: 0x494951 }
];
