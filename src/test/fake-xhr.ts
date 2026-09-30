/**
 * `XMLHttpRequest` falso para probar subidas con progreso/cancelación: jsdom no emite
 * eventos de progreso de subida y msw no los simula. Cada test instala la clase con
 * `vi.stubGlobal('XMLHttpRequest', FakeXhr)` y dirige la respuesta a mano.
 */
export class FakeXhr {
  static instances: FakeXhr[] = []
  static get last(): FakeXhr {
    return FakeXhr.instances[FakeXhr.instances.length - 1]
  }
  static reset() {
    FakeXhr.instances = []
  }

  method = ''
  url = ''
  headers: Record<string, string> = {}
  body: unknown = null
  status = 0
  statusText = ''
  responseText = ''
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = {
    onprogress: null,
  }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  aborted = false

  constructor() {
    FakeXhr.instances.push(this)
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value
  }

  send(body: unknown) {
    this.body = body
  }

  abort() {
    this.aborted = true
    this.onabort?.()
  }

  // ── helpers de test ──
  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total })
  }

  respond(status: number, body: unknown) {
    this.status = status
    this.responseText = JSON.stringify(body)
    this.onload?.()
  }
}
