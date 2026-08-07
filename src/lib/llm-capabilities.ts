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

export type ConnectionTestKind = 'chat' | 'image'

/**
 * Tests de conexión que aplican a un modelo, según sus capabilities.
 *
 * - `image_output` → también corre el test de generación de imágenes
 *   (POST /image-generation/test_connection), porque esos modelos no
 *   tienen endpoint de chat/completions (siempre 404 en /llms/{id}/test_connection).
 * - `text_output` (o sin capabilities declaradas, para no dejar el modelo
 *   sin ningún test) → corre el test de chat (POST /llms/{id}/test_connection).
 *
 * Un modelo multimodal (text_output + image_output) corre ambos.
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
