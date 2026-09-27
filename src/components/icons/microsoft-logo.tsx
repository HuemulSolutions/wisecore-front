import type { SVGProps } from 'react'

/** Logo de Microsoft (cuatro cuadrados). Solo decorativo: `aria-hidden`. */
export function MicrosoftLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 21 21" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}
