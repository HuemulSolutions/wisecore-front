import type { ExternalInputField } from "@/types/external-asset-import"

// Matches {{input:key}} placeholders in a raw string. Deliberately NOT parsed as JSON:
// the ExternalFunctionality body is a free-form string template that may be invalid JSON
// precisely because of unquoted placeholders (e.g. `{"n": {{input:count}}}`). Working on
// the raw string keeps this immune to that, and it must never throw.
const INPUT_PLACEHOLDER_RE = /\{\{\s*input\s*:\s*([^}|\s]+?)\s*\}\}/g

// Defensive cap against a pathological/corrupted body generating hundreds of fields.
const MAX_INPUT_FIELDS = 30

/**
 * Extracts {{input:key}} keys from a functionality's raw body, deduplicated and in
 * order of first appearance. Ignores {{secret:...}} and any other namespace.
 */
export function parseExternalInputKeys(body?: string | null): string[] {
  if (!body) return []

  const seen = new Set<string>()
  for (const match of body.matchAll(INPUT_PLACEHOLDER_RE)) {
    const key = match[1]?.trim()
    if (key) seen.add(key)
    if (seen.size >= MAX_INPUT_FIELDS) break
  }

  return Array.from(seen)
}

// "target_audience" | "target-audience" -> "Target audience"
// Keys are user/config data, not UI copy — humanized, never translated.
export function humanizeInputKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim()
  if (!spaced) return key
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function buildExternalInputFields(body?: string | null): ExternalInputField[] {
  return parseExternalInputKeys(body).map((key) => ({ key, label: humanizeInputKey(key) }))
}
