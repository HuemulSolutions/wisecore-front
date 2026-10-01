import { ApiError } from '@/types/api-error'

// Identificadores que leen los agentes (MCP): `agent_slug` de una colección para agentes
// y `agent_facet_key` de un custom field-faceta. Mismo formato kebab-case que valida
// el backend (`^[a-z0-9]+(-[a-z0-9]+)*$`); acá solo se adelanta el error al usuario.
export const AGENT_IDENTIFIER_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const AGENT_SLUG_MAX_LENGTH = 80
export const AGENT_FACET_KEY_MAX_LENGTH = 60
export const AGENT_USAGE_MAX_LENGTH = 2000

export function isValidAgentIdentifier(value: string): boolean {
  return AGENT_IDENTIFIER_PATTERN.test(value)
}

/**
 * Sugiere un identificador kebab-case a partir de un nombre visible:
 * "Arquitectura de Software" → "arquitectura-de-software". Quita acentos,
 * colapsa todo lo que no sea [a-z0-9] en un guion y recorta al máximo.
 */
export function suggestAgentIdentifier(name: string, maxLength = AGENT_SLUG_MAX_LENGTH): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
}

/** 409 del backend: el slug / la clave de faceta ya la usa otra entidad de la organización. */
export function isConflictError(error: unknown): boolean {
  return ApiError.isApiError(error) && error.statusCode === 409
}
