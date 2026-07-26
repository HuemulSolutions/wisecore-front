import { Component, type ErrorInfo, type ReactNode } from 'react'

const AUTO_RECOVER_KEY = 'wisecore:auto-recovered-at'
const AUTO_RECOVER_WINDOW_MS = 30_000

/**
 * Errores lanzados desde la fase de mutación de React (commitDeletionEffects /
 * commitPlacement) cuando el DOM vivo ya no coincide con el árbol de fibers.
 * La causa habitual es un agente externo reparentando nodos que React posee:
 * el traductor integrado del navegador envolviendo texto en <font>, o una
 * extensión. No hay forma de reparar el árbol desde dentro de React; la única
 * recuperación segura es reconstruir el documento.
 */
function isDomDesyncError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message ?? ''
  const isNotFound = error.name === 'NotFoundError' || message.includes('NotFoundError')
  return (
    isNotFound &&
    (message.includes('removeChild') ||
      message.includes('insertBefore') ||
      message.includes('appendChild'))
  )
}

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Ojo: main.tsx sobreescribe console.error; usamos warn para no ser filtrados.
    console.warn('[AppErrorBoundary]', error.name, error.message, info.componentStack)
    if (/\btranslated-(ltr|rtl)\b/.test(document.documentElement.className)) {
      console.warn('[AppErrorBoundary] pagina traducida por el navegador detectada')
    }

    if (!isDomDesyncError(error)) return

    // Auto-recuperación de un solo disparo: nunca recargar dos veces dentro de
    // la misma ventana, o un desync persistente se vuelve un bucle de recargas.
    const last = Number(sessionStorage.getItem(AUTO_RECOVER_KEY) ?? 0)
    if (Date.now() - last < AUTO_RECOVER_WINDOW_MS) return

    sessionStorage.setItem(AUTO_RECOVER_KEY, String(Date.now()))
    window.location.reload()
  }

  private handleReload = () => {
    sessionStorage.removeItem(AUTO_RECOVER_KEY)
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    // Fallback sin dependencias: nada de i18next, Radix ni Tailwind, para que
    // no pueda fallar por la misma causa. translate="no" explícito.
    return (
      <div
        translate="no"
        className="notranslate"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Algo salió mal</h1>
        <p style={{ fontSize: 14, color: '#666', maxWidth: 420 }}>
          Si tienes activada la traducción automática del navegador para este sitio,
          desactívala: puede interferir con la aplicación.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#4464f7',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </div>
    )
  }
}
