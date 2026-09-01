/**
 * `Resizable`/`Caption` (de @platejs/resizable y ./caption) solo aceptan
 * left/center/right, pero `TextAlignPlugin` escribe `start`/`end`/`justify`
 * también. Este helper normaliza el `align` guardado en el nodo al subset
 * que esos componentes entienden.
 */
export type ResizableAlign = 'left' | 'center' | 'right'

export function resolveResizableAlign(
  value: unknown,
  fallback: ResizableAlign = 'center'
): ResizableAlign {
  switch (value) {
    case 'left':
    case 'start':
      return 'left'
    case 'right':
    case 'end':
      return 'right'
    case 'center':
    case 'justify':
      return 'center'
    default:
      return fallback
  }
}
