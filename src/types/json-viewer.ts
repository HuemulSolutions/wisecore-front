export type TokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "whitespace"

export interface Token {
  type: TokenType
  value: string
}

export interface JsonViewerProps {
  /** Raw JSON string (pretty-printed or compact) */
  value: string
  /** Extra className on the outer wrapper */
  className?: string
  /** Minimum height (default: unset) */
  minHeight?: string
  /** Maximum height — adds scrollbar when exceeded */
  maxHeight?: string
}
