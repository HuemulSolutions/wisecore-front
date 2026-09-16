export interface ContextItem {
  id: string
  name: string
  /** Puede venir null: contexto placeholder creado con required=true y sin contenido. */
  content: string | null
  context_type?: string
  /** Bloquea la generación con IA mientras no tenga contenido. Default false. */
  required?: boolean
}

export interface AddTextContextBody {
  name: string
  content?: string
  required?: boolean
}

export interface EditTextContextBody {
  name?: string
  content?: string
  required?: boolean
}
