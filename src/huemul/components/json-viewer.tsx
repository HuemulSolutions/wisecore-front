import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TokenType, Token, JsonViewerProps } from "@/types/json-viewer"

export type { TokenType, Token, JsonViewerProps }

// ── Tokenizer ────────────────────────────────────────────────────────────────

const TOKEN_REGEX =
  /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])|(\s+)/g

export function tokenize(json: string): Token[] {
  const tokens: Token[] = []
  let match: RegExpExecArray | null
  let lastIndex = 0

  TOKEN_REGEX.lastIndex = 0

  while ((match = TOKEN_REGEX.exec(json)) !== null) {
    const [full, key, str, bool, nil, num, punct, ws] = match

    // Preserve any characters the regex couldn't classify (e.g. mid-edit invalid JSON)
    // so the highlighted layer never silently drops text the user typed.
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: json.slice(lastIndex, match.index) })
    }
    lastIndex = TOKEN_REGEX.lastIndex

    if (key !== undefined) {
      // Split trailing colon from the key string so we can colour them separately
      const colonIdx = full.lastIndexOf(":")
      tokens.push({ type: "key", value: full.slice(0, colonIdx).trimEnd() })
      tokens.push({ type: "punctuation", value: ":" })
      // keep any space that was between key and colon
      const space = full.slice(colonIdx + 1)
      if (space) tokens.push({ type: "whitespace", value: space })
    } else if (str !== undefined) {
      tokens.push({ type: "string", value: str })
    } else if (bool !== undefined) {
      tokens.push({ type: "boolean", value: bool })
    } else if (nil !== undefined) {
      tokens.push({ type: "null", value: nil })
    } else if (num !== undefined) {
      tokens.push({ type: "number", value: num })
    } else if (punct !== undefined) {
      tokens.push({ type: "punctuation", value: punct })
    } else if (ws !== undefined) {
      tokens.push({ type: "whitespace", value: ws })
    }
  }

  if (lastIndex < json.length) {
    tokens.push({ type: "text", value: json.slice(lastIndex) })
  }

  return tokens
}

// Token styles use the app's CSS variable palette so they adapt to light/dark mode automatically
export const tokenStyle: Record<TokenType, React.CSSProperties> = {
  // keys → primary (blue-purple)
  key: { color: "var(--primary)" },
  // strings → chart-2 (teal)
  string: { color: "var(--chart-2)" },
  // numbers → chart-1 (orange)
  number: { color: "var(--chart-1)" },
  // booleans → chart-4 (amber)
  boolean: { color: "var(--chart-4)" },
  // null → destructive (red)
  null: { color: "var(--destructive)" },
  // punctuation → muted-foreground
  punctuation: { color: "var(--muted-foreground)" },
  whitespace: {},
  // fallback for characters the tokenizer can't classify (e.g. mid-edit invalid JSON)
  text: { color: "var(--foreground)" },
}

// ── Public component ─────────────────────────────────────────────────────────

export function JsonViewer({ value, className, minHeight, maxHeight = "600px" }: JsonViewerProps) {
  const { formatted, tokens, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(value)
      const formatted = JSON.stringify(parsed, null, 2)
      return { formatted, tokens: tokenize(formatted), error: null }
    } catch {
      // If not valid JSON, display as-is
      return { formatted: value, tokens: null, error: true }
    }
  }, [value])

  return (
    <pre
      className={cn(
        "text-xs font-mono rounded-md border bg-muted/40 p-4 overflow-auto select-text",
        className,
      )}
      style={{ minHeight, maxHeight }}
    >
      {error || !tokens ? (
        <span className="text-foreground">{formatted}</span>
      ) : (
        tokens.map((token, i) =>
          token.type === "whitespace" ? (
            token.value
          ) : (
            <span key={i} style={tokenStyle[token.type]}>
              {token.value}
            </span>
          ),
        )
      )}
    </pre>
  )
}
