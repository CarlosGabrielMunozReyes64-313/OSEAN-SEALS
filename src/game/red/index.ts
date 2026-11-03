import { Client } from '@colyseus/sdk';
import type { MapSchema, Schema } from '@colyseus/schema';
import { actualizarPerfil, type Perfil } from '../services/datosJugador';

export type Direccion = 'derecha' | 'abajo' | 'arriba' | 'izquierda';
export interface Movimiento { x: number; y: number; direccion: Direccion }
export interface Jugador extends Movimiento { nombre: string; color: number }
export interface Plaza extends Schema { jugadores: MapSchema<Jugador> }
export interface Chat { sessionId: string; texto: string }
export interface Expulsion { motivo: string }

const url = import.meta.env.VITE_SERVER_URL;
const cliente = new Client(url);
export async function comprobarSesion() {
    const { user } = await cliente.auth.getUserData<Perfil>();
    if (!user || typeof user.nombre !== 'string') throw new Error('sesion_invalida');
    const { id, nombre, color, monedas } = user;
    actualizarPerfil({ id, nombre, color, monedas });
}
export async function iniciarSesion(email: string, clave: string) {
    await cliente.auth.signInWithEmailAndPassword(email, clave);
    await comprobarSesion();
}
export async function cerrarSesion() {
    await cliente.auth.signOut();
    actualizarPerfil(null);
}
export async function registrar(nombre: string, email: string, clave: string) {
    await cerrarSesion();
    await cliente.auth.registerWithEmailAndPassword(email, clave, { nombre });
    await comprobarSesion();
}
export async function disponibilidad(nombre: string, signal: AbortSignal) {
    const ruta = new URL(url);
    ruta.protocol = ruta.protocol === 'wss:' ? 'https:' : 'http:';
    ruta.pathname = ruta.pathname.replace(/\/$/, '') + '/api/nombre-disponible';
    ruta.searchParams.set('nombre', nombre);
    const respuesta = await fetch(ruta, { signal });
    if (!respuesta.ok) throw new Error();
    return await respuesta.json() as { disponible: boolean; motivo?: string };
}
export const entrarPlaza = () => cliente.joinOrCreate<Plaza>('plaza');
export type Sala = Awaited<ReturnType<typeof entrarPlaza>>;
const errores: Record<string, string> = {
    email_malformed: 'Revisa el formato del correo.',
    email_already_in_use: 'Ya existe una cuenta con ese correo.',
    contrasena_corta: 'Elige una contraseña más larga.',
    contrasena_larga: 'La contraseña es demasiado larga.',
    nombre_requerido: 'Escribe un nombre para tu foca.',
    nombre_largo_invalido: 'El nombre debe tener entre 3 y 16 caracteres.',
    nombre_caracteres_invalidos: 'El nombre contiene caracteres que no se admiten.',
    nombre_no_permitido: 'Elige otro nombre para tu foca.',
    nombre_ocupado: 'Ese nombre ya está ocupado.',
    invalid_credentials: 'Revisa tu correo y contraseña.',
    demasiados_intentos: 'Has hecho varios intentos. Espera un momento.',
    banned: 'Esta cuenta tiene el acceso bloqueado.',
    invitados_desactivados: 'Inicia sesión para jugar.',
    sesion_requerida: 'Inicia sesión para entrar a la plaza.',
    sesion_invalida: 'Tu sesión venció. Vuelve a iniciar sesión.',
    cuenta_suspendida: 'Tu cuenta está suspendida.'
};
export function codigo(error: unknown) { return error instanceof Error ? error.message : ''; }
export function mensaje(error: unknown) {
    return errores[codigo(error)] ?? 'No se pudo completar la conexión. Inténtalo de nuevo.';
}
