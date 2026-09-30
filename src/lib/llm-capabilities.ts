/**
 * Fuente única de las capabilities de un LLM. Antes duplicada como
 * `ALL_CAPABILITIES` en models-capabilities-dialog.tsx y models-dialog.tsx,
 * y la lógica de bifurcación del test de conexión vivía como un string
 * literal (`'image_output'`) en models.tsx.
 */
export const LLM_CAPABILITIES = [
  'text_input',
  'text_output',
  'image_input',
  'image_output',
  'tool_use',
] as const

export type LLMCapability = (typeof LLM_CAPABILITIES)[number]

export function hasCapability(model: { capabilities?: string[] }, cap: LLMCapability): boolean {
  return !!model.capabilities?.includes(cap)
}

/**
 * Capabilities que exige cada propósito. Copia de `PURPOSE_REQUIRED_CAPABILITIES` del
 * backend (`src/modules/llm/models.py`): si no coinciden, el backend responde 400
 * `LLM_MISSING_CAPABILITY` y la UI habría ofrecido una opción inválida.
 */
export const PURPOSE_REQUIRED_CAPABILITIES = {
  rerank: ['text_input', 'text_output'],
  image_analysis: ['image_input'],
} as const satisfies Record<string, readonly LLMCapability[]>

export type LLMPurposeKey = keyof typeof PURPOSE_REQUIRED_CAPABILITIES

export const LLM_PURPOSES = Object.keys(PURPOSE_REQUIRED_CAPABILITIES) as LLMPurposeKey[]

/** Capabilities que le faltan a `model` para `purpose` (vacío = puede usarse). */
export function missingPurposeCapabilities(
  model: { capabilities?: string[] },
  purpose: LLMPurposeKey,
): LLMCapability[] {
  return PURPOSE_REQUIRED_CAPABILITIES[purpose].filter((cap) => !hasCapability(model, cap))
}

/** Si `model` está marcado para `purpose`. */
export function isMarkedForPurpose(
  model: { is_rerank_default?: boolean; is_image_analysis_default?: boolean },
  purpose: LLMPurposeKey,
): boolean {
  return purpose === 'rerank' ? !!model.is_rerank_default : !!model.is_image_analysis_default
}

/** Capabilities que no se pueden quitar del modelo porque las exige un propósito marcado. */
export function lockedCapabilities(model: {
  is_rerank_default?: boolean
  is_image_analysis_default?: boolean
}): Set<LLMCapability> {
  const locked = new Set<LLMCapability>()
  for (const purpose of LLM_PURPOSES) {
    if (isMarkedForPurpose(model, purpose)) PURPOSE_REQUIRED_CAPABILITIES[purpose].forEach((cap) => locked.add(cap))
  }
  return locked
}

export type ConnectionTestKind = 'chat' | 'image'

/**
 * Tests de conexión que aplican a un modelo, según sus capabilities.
 *
 * - `image_output` → habilita el test de generación de imágenes
 *   (POST /image-generation/test_connection), porque esos modelos no
 *   tienen endpoint de chat/completions (siempre 404 en /llms/{id}/test_connection).
 * - `text_output` (o sin capabilities declaradas, para no dejar el modelo
 *   sin ningún test) → habilita el test de chat (POST /llms/{id}/test_connection).
 *
 * Un modelo multimodal (text_output + image_output) ofrece ambos tests
 * y el usuario elige cuál correr (ver menú del botón "Probar conexión"
 * en models.tsx); si solo aplica uno, se ejecuta directo sin menú.
 */
export function resolveConnectionTests(model: { capabilities?: string[] }): ConnectionTestKind[] {
  const kinds: ConnectionTestKind[] = []
  const hasImageOutput = hasCapability(model, 'image_output')
  const hasTextOutput = hasCapability(model, 'text_output')

  if (hasTextOutput || (!hasImageOutput && !hasTextOutput)) {
    kinds.push('chat')
  }
  if (hasImageOutput) {
    kinds.push('image')
  }

  return kinds
}
