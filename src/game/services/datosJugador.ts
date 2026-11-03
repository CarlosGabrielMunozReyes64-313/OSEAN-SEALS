export interface Perfil { id: string; nombre: string; color: number; monedas: number }
// El SDK administra la sesión. Solo conservamos los datos visibles en memoria.
export let perfil: Perfil | null = null;
export function actualizarPerfil(valor: Perfil | null) { perfil = valor; }
