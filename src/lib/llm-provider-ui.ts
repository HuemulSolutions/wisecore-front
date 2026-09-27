const TINTS = [
  "bg-[#2563eb]",
  "bg-[#7c3aed]",
  "bg-[#16a34a]",
  "bg-[#ea580c]",
  "bg-[#db2777]",
  "bg-[#0891b2]",
  "bg-[#e11d48]",
]

/** Iniciales del tipo de proveedor: `azure_openai` → `AO`, `openai` → `OP`. */
export function providerInitials(type: string): string {
  const parts = type.split(/[_\s-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Clase de fondo estable por tipo de proveedor (mismo tipo → mismo color). */
export function providerTint(type: string): string {
  const hash = type.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return TINTS[hash % TINTS.length]
}

/** Placeholder del identificador del modelo según el tipo de proveedor. */
const MODEL_IDENTIFIER_PLACEHOLDERS: Record<string, string> = {
  openai: "gpt-4o",
  azure_openai: "mi-deployment-gpt-4o",
  azure_ai_foundry: "FLUX.2-pro",
  anthropic: "claude-sonnet-4-5",
  google_vertex_ai: "gemini-2.5-pro",
  google_gemini: "gemini-2.5-pro",
}

export function modelIdentifierPlaceholder(type: string | undefined): string | undefined {
  return type ? MODEL_IDENTIFIER_PLACEHOLDERS[type] : undefined
}
