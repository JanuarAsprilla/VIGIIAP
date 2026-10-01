// Solo lo mínimo de 'node:fs' que usan las pruebas que leen archivos del proyecto (no se agrega @types/node al bundle del navegador).
declare module 'node:fs' {
  export function readFileSync(ruta: URL | string, codificacion: 'utf8'): string
}
