/**
 * Providers cuya credencial (`key`) es un documento multilínea (ej. el JSON
 * completo de una service account) en vez de una API key de una sola línea.
 * google_vertex_ai: la librería usada por el backend no soporta autenticación
 * por API key simple, requiere el JSON de la service account.
 */
export const MULTILINE_KEY_PROVIDERS = ['google_vertex_ai'] as const

export function isMultilineKeyProvider(providerType: string | undefined): boolean {
  if (!providerType) return false
  return (MULTILINE_KEY_PROVIDERS as readonly string[]).includes(providerType)
}

interface ProviderHelpLinks {
  credentials_url?: string
  docs_url?: string
}

/**
 * Link de ayuda a mostrar junto a un campo de credencial. Prioriza el link
 * directo para obtener la credencial (`credentials_url`); si el provider no
 * lo tiene, cae a su documentación general (`docs_url`).
 */
export function getProviderHelpUrl(provider: ProviderHelpLinks | undefined): string | undefined {
  return provider?.credentials_url || provider?.docs_url || undefined
}

/** true si el link resuelto es el de credenciales (para elegir el tooltip correcto). */
export function isCredentialsHelpUrl(provider: ProviderHelpLinks | undefined): boolean {
  return !!provider?.credentials_url
}
