// El backend valida ahora si una dependencia (sección ai/manual/form) tiene contenido
// real antes de generar. Cuando falta, marca la ejecución como failed con uno de
// estos mensajes (ver "ia context"): "Missing dependency outputs." (chequeo previo)
// o "Missing dependency output." (detectado en runtime durante el loop de generación).
// Una sección form respondida aporta su contenido como contexto; sin respuestas solo
// bloquea en regeneración parcial (`start_section_id`) — en generación completa se
// usa contenido vacío.
const MISSING_DEPENDENCY_RE = /^\s*missing\s+dependency\s+outputs?\.?\s*$/i;

export function isMissingDependencyFailure(statusMessage?: string | null): boolean {
  return typeof statusMessage === 'string' && MISSING_DEPENDENCY_RE.test(statusMessage);
}
