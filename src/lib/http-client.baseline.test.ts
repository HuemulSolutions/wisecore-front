/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · http-client.
 * Comportamiento actual de selección de token y manejo de errores que se conserva.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import { ApiError } from '@/types/api-error'
import { server } from '@/test/msw/server'
import { respondApiError, respondLegacyError } from '@/test/msw/respond'
import { makeLoginToken } from '@/test/jwt'
import { rootElevationStore } from '@/lib/root-elevation-store'

function captureHeaders(path: string, method: 'get' | 'post' = 'get') {
  const seen: { authorization: string | null; orgId: string | null } = { authorization: null, orgId: null }
  server.use(
    http[method](`${backendUrl}${path}`, ({ request }) => {
      seen.authorization = request.headers.get('Authorization')
      seen.orgId = request.headers.get('X-Org-Id')
      return HttpResponse.json({ data: {} })
    }),
  )
  return seen
}

describe('httpClient · selección de token por URL', () => {
  it('URLs con /auth/ usan el login token y NO mandan X-Org-Id', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/auth/codes', 'post')

    await httpClient.post(`${backendUrl}/auth/codes`, { email: 'a@example.com' })

    expect(seen.authorization).toBe('Bearer login-token')
    expect(seen.orgId).toBeNull()
  })

  it('/user_roles/user_token usa el login token y respeta el X-Org-Id explícito', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/user_roles/user_token', 'post')

    await httpClient.post(`${backendUrl}/user_roles/user_token`, null, { headers: { 'X-Org-Id': 'org-2' } })

    expect(seen.authorization).toBe('Bearer login-token')
    expect(seen.orgId).toBe('org-2')
  })

  it('endpoints org-scoped usan el org token y agregan X-Org-Id', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/documents/')

    await httpClient.get(`${backendUrl}/documents/`)

    expect(seen.authorization).toBe('Bearer org-token')
    expect(seen.orgId).toBe('org-1')
  })

  it('sin org token, los endpoints org-scoped caen al login token (root admin en Global Admin)', async () => {
    httpClient.setLoginToken('login-token')
    const seen = captureHeaders('/documents/')

    await httpClient.get(`${backendUrl}/documents/`)

    expect(seen.authorization).toBe('Bearer login-token')
  })

  it('/organizations/{org activa}/... usa el org token (el backend lee is_org_admin de ahí)', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/organizations/org-1/users')

    await httpClient.get(`${backendUrl}/organizations/org-1/users`)

    expect(seen.authorization).toBe('Bearer org-token')
    expect(seen.orgId).toBe('org-1')
  })

  it('/organizations y /organizations/{otra org}/... siguen con el login token (root admin cross-org)', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const list = captureHeaders('/organizations')
    await httpClient.get(`${backendUrl}/organizations`)
    expect(list.authorization).toBe('Bearer login-token')

    const other = captureHeaders('/organizations/org-2/users')
    await httpClient.get(`${backendUrl}/organizations/org-2/users`, { headers: { 'X-Org-Id': 'org-2' } })
    expect(other.authorization).toBe('Bearer login-token')
  })
})

describe('httpClient · errores', () => {
  it('401 real dispara onUnauthorized y marca el ApiError como handled', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(http.get(`${backendUrl}/documents/`, () => respondApiError(401, 'UNAUTHORIZED', 'Token expired', 'Token expired')))

    const error = await httpClient.get(`${backendUrl}/documents/`).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).handled).toBe(true)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).toHaveBeenCalledWith('expired')
  })

  it('403 USER_NOT_ACTIVE (usuario desactivado o pendiente) cierra la sesión con motivo "inactive"', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(
      http.post(`${backendUrl}/user_roles/user_token`, () =>
        respondApiError(403, 'USER_NOT_ACTIVE', 'User is not active', 'User is not active'),
      ),
    )

    const error = (await httpClient.post(`${backendUrl}/user_roles/user_token`).catch((e: unknown) => e)) as ApiError

    expect(error.handled).toBe(true)
    expect(onUnauthorized).toHaveBeenCalledWith('inactive')
  })

  it('401 de permisos (FORBIDDEN) NO cierra sesión', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(http.get(`${backendUrl}/documents/`, () => respondApiError(401, 'FORBIDDEN', 'No role', 'no permission')))

    await expect(httpClient.get(`${backendUrl}/documents/`)).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('403 no llama a onUnauthorized y expone code/detail', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(
      http.post(`${backendUrl}/user_roles/user_token`, () =>
        respondApiError(403, 'AUTH_METHOD_REQUIRED', 'Method required', { required_auth_flow: { auth_flow: 'sso' } }),
      ),
    )

    const error = (await httpClient.post(`${backendUrl}/user_roles/user_token`).catch((e: unknown) => e)) as ApiError

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(error.code).toBe('AUTH_METHOD_REQUIRED')
    expect(error.statusCode).toBe(403)
    // `detail` objeto se serializa a string: los consumidores usan parseErrorDetail.
    expect(JSON.parse(error.detail)).toEqual({ required_auth_flow: { auth_flow: 'sso' } })
  })

  it('un body de error no estándar produce un Error genérico con el mensaje', async () => {
    server.use(http.get(`${backendUrl}/documents/`, () => respondLegacyError(500, { message: 'boom' })))

    const error = await httpClient.get(`${backendUrl}/documents/`).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
    expect((error as Error).message).toBe('boom')
  })

  it('403 INSUFFICIENT_PERMISSIONS se lanza una sola vez, sin reintento y sin marcar handled (también para un root admin)', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    httpClient.setLoginToken(makeLoginToken({ is_root_admin: true }))
    let calls = 0
    server.use(
      http.post(`${backendUrl}/documents/`, () => {
        calls += 1
        return respondApiError(403, 'INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 'asset:c')
      }),
    )

    const error = (await httpClient.post(`${backendUrl}/documents/`, { name: 'x' }).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(error.handled).toBeFalsy()
    expect(calls).toBe(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('agrega Content-Type JSON cuando hay body', async () => {
    let contentType: string | null = null
    server.use(
      http.post(`${backendUrl}/auth/codes`, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.post(`${backendUrl}/auth/codes`, { email: 'a@example.com' })

    expect(contentType).toBe('application/json')
  })
})

describe('httpClient · headers y bodies', () => {
  it('sin modo administrador ninguna request lleva X-Root-Elevation, tampoco la de un root admin', async () => {
    httpClient.setLoginToken(makeLoginToken({ is_root_admin: true }))
    const seen: (string | null)[] = []
    server.use(
      http.get(`${backendUrl}/users/`, ({ request }) => {
        seen.push(request.headers.get('X-Root-Elevation'))
        return HttpResponse.json({ data: [] })
      }),
      http.post(`${backendUrl}/auth/codes`, ({ request }) => {
        seen.push(request.headers.get('X-Root-Elevation'))
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.get(`${backendUrl}/users/`)
    await httpClient.post(`${backendUrl}/auth/codes`, { email: 'a@example.com' })

    expect(seen).toEqual([null, null])
  })

  it('un header explícito del caller no se pisa', async () => {
    httpClient.setLoginToken('login-token')
    let authorization: string | null = null
    server.use(
      http.get(`${backendUrl}/documents/`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.get(`${backendUrl}/documents/`, { headers: { Authorization: 'Bearer explicit' } })

    expect(authorization).toBe('Bearer explicit')
  })

  it('un body JSON llega intacto al backend', async () => {
    httpClient.setLoginToken('login-token')
    let json: unknown = null
    server.use(
      http.patch(`${backendUrl}/organizations/org-2`, async ({ request }) => {
        json = await request.json()
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.patch(`${backendUrl}/organizations/org-2`, { name: 'Org 2', max_users: 5 })

    expect(json).toEqual({ name: 'Org 2', max_users: 5 })
  })

  it('un body FormData se pasa tal cual a fetch, sin Content-Type JSON', async () => {
    // msw no puede leer el FormData de jsdom (request.formData() no resuelve): se
    // verifica lo que httpClient le entrega a fetch, que es lo que importa.
    httpClient.setLoginToken('login-token')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(HttpResponse.json({ data: {} }))
    const form = new FormData()
    form.append('file', new File(['hola'], 'nota.txt', { type: 'text/plain' }))

    await httpClient.fetch(`${backendUrl}/media/`, { method: 'POST', body: form })

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.body).toBe(form)
    // El navegador arma el Content-Type multipart con su boundary.
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
    fetchSpy.mockRestore()
  })
})

/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque B): `X-Root-Elevation`
 * y reintento tras verificar el código.
 */
describe('httpClient · modo administrador', () => {
  const rootLogin = () => httpClient.setLoginToken(makeLoginToken({ is_root_admin: true }))
  const elevate = (token = 'elev-1') => rootElevationStore.setElevation(token, Date.now() + 30 * 60 * 1000)

  /** Handler que responde 403 con `code` mientras no llegue el header `validToken`. */
  function rootOnly(method: 'get' | 'post', path: string, code: string, validToken = 'elev-new') {
    const calls: { elevation: string | null; body: string | null }[] = []
    server.use(
      http[method](`${backendUrl}${path}`, async ({ request }) => {
        const elevation = request.headers.get('X-Root-Elevation')
        calls.push({ elevation, body: method === 'post' ? await request.text() : null })
        if (elevation !== validToken) {
          return respondApiError(403, code, 'Root admin mode required', 'Verify your identity')
        }
        return HttpResponse.json({ data: { ok: true } })
      }),
    )
    return calls
  }

  /** Simula el diálogo: cuando se abre un pedido, lo resuelve con `token` (o lo cancela). */
  function answerPrompt(token: string | null) {
    const seen: string[] = []
    let lastId: number | null = null
    const unsubscribe = rootElevationStore.subscribe(() => {
      const prompt = rootElevationStore.getSnapshot().prompt
      // El store emite varias veces por pedido (abrir, guardar token, cerrar): contar cada pedido una vez.
      if (!prompt || prompt.id === lastId) return
      lastId = prompt.id
      seen.push(prompt.reason)
      queueMicrotask(() => {
        if (token) rootElevationStore.resolve(prompt.id, token, Date.now() + 30 * 60 * 1000)
        else rootElevationStore.cancel()
      })
    })
    return { seen, unsubscribe }
  }

  it('con el token vigente toda request lleva X-Root-Elevation; un header explícito del caller no se pisa', async () => {
    rootLogin()
    elevate('elev-1')
    const seen: (string | null)[] = []
    server.use(
      http.get(`${backendUrl}/documents/`, ({ request }) => {
        seen.push(request.headers.get('X-Root-Elevation'))
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.get(`${backendUrl}/documents/`)
    await httpClient.get(`${backendUrl}/documents/`, { headers: { 'X-Root-Elevation': 'explicit' } })

    expect(seen).toEqual(['elev-1', 'explicit'])
  })

  it('403 ROOT_ELEVATION_REQUIRED de un root: abre el pedido y repite la misma request una vez con el header nuevo', async () => {
    rootLogin()
    const calls = rootOnly('post', '/organizations/', 'ROOT_ELEVATION_REQUIRED')
    const prompt = answerPrompt('elev-new')

    const response = await httpClient.post(`${backendUrl}/organizations/`, { name: 'Nueva' })

    expect(await response.json()).toEqual({ data: { ok: true } })
    expect(prompt.seen).toEqual(['required'])
    expect(calls).toEqual([
      { elevation: null, body: JSON.stringify({ name: 'Nueva' }) },
      { elevation: 'elev-new', body: JSON.stringify({ name: 'Nueva' }) },
    ])
    prompt.unsubscribe()
  })

  it.each(['ROOT_ELEVATION_EXPIRED', 'ROOT_ELEVATION_INVALID'])('403 %s: descarta el token enviado, pide el código con motivo "expired" y reintenta', async (code) => {
    rootLogin()
    elevate('elev-old')
    const calls = rootOnly('get', '/users/', code)
    const prompt = answerPrompt('elev-new')

    await httpClient.get(`${backendUrl}/users/`)

    expect(prompt.seen).toEqual(['expired'])
    expect(calls.map((c) => c.elevation)).toEqual(['elev-old', 'elev-new'])
    expect(rootElevationStore.getToken()).toBe('elev-new')
    prompt.unsubscribe()
  })

  it('cancelar el pedido relanza el error original marcado handled', async () => {
    rootLogin()
    const calls = rootOnly('get', '/users/', 'ROOT_ELEVATION_REQUIRED')
    const prompt = answerPrompt(null)

    const error = (await httpClient.get(`${backendUrl}/users/`).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('ROOT_ELEVATION_REQUIRED')
    expect(error.handled).toBe(true)
    expect(calls).toHaveLength(1)
    prompt.unsubscribe()
  })

  it('un 403 de elevación en el reintento se lanza sin abrir otro diálogo', async () => {
    rootLogin()
    // El backend rechaza también el token nuevo (p. ej. dejó de ser root en el medio).
    const calls = rootOnly('get', '/users/', 'ROOT_ELEVATION_INVALID', 'never')
    const prompt = answerPrompt('elev-new')

    const error = (await httpClient.get(`${backendUrl}/users/`).catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe('ROOT_ELEVATION_INVALID')
    expect(error.handled).toBeFalsy()
    expect(prompt.seen).toEqual(['expired'])
    expect(calls).toHaveLength(2)
    prompt.unsubscribe()
  })

  it('un 403 de elevación en /auth/root-elevation/* nunca abre el diálogo', async () => {
    rootLogin()
    rootOnly('post', '/auth/root-elevation/code', 'ROOT_ELEVATION_REQUIRED')
    const prompt = answerPrompt('elev-new')

    await expect(httpClient.post(`${backendUrl}/auth/root-elevation/code`)).rejects.toBeInstanceOf(ApiError)

    expect(prompt.seen).toEqual([])
    prompt.unsubscribe()
  })

  it('un usuario sin la pista is_root_admin recibe el error sin diálogo', async () => {
    httpClient.setLoginToken(makeLoginToken({ is_root_admin: false }))
    const calls = rootOnly('get', '/users/', 'ROOT_ELEVATION_REQUIRED')
    const prompt = answerPrompt('elev-new')

    const error = (await httpClient.get(`${backendUrl}/users/`).catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe('ROOT_ELEVATION_REQUIRED')
    expect(error.handled).toBeFalsy()
    expect(prompt.seen).toEqual([])
    expect(calls).toHaveLength(1)
    prompt.unsubscribe()
  })

  it('varias requests con 403 a la vez abren un solo diálogo y todas se reintentan', async () => {
    rootLogin()
    const calls = rootOnly('get', '/users/', 'ROOT_ELEVATION_REQUIRED')
    const prompt = answerPrompt('elev-new')

    const responses = await Promise.all([httpClient.get(`${backendUrl}/users/`), httpClient.get(`${backendUrl}/users/`)])

    expect(responses.every((r) => r.ok)).toBe(true)
    expect(prompt.seen).toEqual(['required'])
    expect(calls.filter((c) => c.elevation === 'elev-new')).toHaveLength(2)
    prompt.unsubscribe()
  })

  it('un 403 atrasado de una request enviada antes de verificar no borra el token nuevo ni reabre el diálogo', async () => {
    rootLogin()
    elevate('elev-old')
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const seen: (string | null)[] = []
    server.use(
      http.get(`${backendUrl}/users/`, async ({ request }) => {
        const elevation = request.headers.get('X-Root-Elevation')
        seen.push(elevation)
        if (elevation === 'elev-old') {
          await gate
          return respondApiError(403, 'ROOT_ELEVATION_EXPIRED', 'Root admin mode has expired')
        }
        return HttpResponse.json({ data: {} })
      }),
    )
    const prompt = answerPrompt(null)

    const pending = httpClient.get(`${backendUrl}/users/`)
    // Mientras viaja, otra parte de la app ya verificó un código nuevo.
    await new Promise((resolve) => setTimeout(resolve, 10))
    rootElevationStore.setElevation('elev-new', Date.now() + 30 * 60 * 1000)
    release()
    const response = await pending

    expect(response.ok).toBe(true)
    expect(seen).toEqual(['elev-old', 'elev-new'])
    expect(rootElevationStore.getToken()).toBe('elev-new')
    expect(prompt.seen).toEqual([])
    prompt.unsubscribe()
  })

  it('un 403 que vuelve después de cambiar de sesión no pide el código ni reintenta con la sesión nueva', async () => {
    rootLogin()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const calls: (string | null)[] = []
    server.use(
      http.post(`${backendUrl}/organizations/`, async ({ request }) => {
        calls.push(request.headers.get('Authorization'))
        await gate
        return respondApiError(403, 'ROOT_ELEVATION_REQUIRED', 'Root admin mode required')
      }),
    )
    const prompt = answerPrompt('elev-new')

    const pending = httpClient.post(`${backendUrl}/organizations/`, { name: 'De A' }).catch((e: unknown) => e)
    await new Promise((resolve) => setTimeout(resolve, 10))
    // Mientras viaja, A cierra sesión y entra B (también root).
    httpClient.setLoginToken(makeLoginToken({ sub: 'user-b', is_root_admin: true }))
    release()
    const error = (await pending) as ApiError

    expect(error.code).toBe('ROOT_ELEVATION_REQUIRED')
    expect(error.handled).toBeFalsy()
    expect(prompt.seen).toEqual([])
    expect(calls).toHaveLength(1)
    prompt.unsubscribe()
  })

  it('si la sesión cambia con el diálogo abierto, verificar no reintenta la request con la sesión nueva', async () => {
    rootLogin()
    const calls = rootOnly('post', '/organizations/', 'ROOT_ELEVATION_REQUIRED')
    // El "diálogo" cambia la sesión antes de verificar.
    const unsubscribe = rootElevationStore.subscribe(() => {
      const prompt = rootElevationStore.getSnapshot().prompt
      if (!prompt) return
      queueMicrotask(() => {
        httpClient.setLoginToken(makeLoginToken({ sub: 'user-b', is_root_admin: true }))
        rootElevationStore.resolve(prompt.id, 'elev-new', Date.now() + 30 * 60 * 1000)
      })
    })

    const error = (await httpClient.post(`${backendUrl}/organizations/`, { name: 'De A' }).catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe('ROOT_ELEVATION_REQUIRED')
    expect(calls).toHaveLength(1)
    unsubscribe()
  })

  it('cambiar de organización con la request en vuelo sí reintenta: es la misma sesión', async () => {
    rootLogin()
    httpClient.setOrganizationToken('org-a')
    httpClient.setOrganizationId('org-a')
    const calls = rootOnly('get', '/users/', 'ROOT_ELEVATION_REQUIRED')
    const unsubscribe = rootElevationStore.subscribe(() => {
      const prompt = rootElevationStore.getSnapshot().prompt
      if (!prompt) return
      queueMicrotask(() => {
        httpClient.setOrganizationToken('org-b')
        httpClient.setOrganizationId('org-b')
        rootElevationStore.resolve(prompt.id, 'elev-new', Date.now() + 30 * 60 * 1000)
      })
    })

    const response = await httpClient.get(`${backendUrl}/users/`)

    expect(response.ok).toBe(true)
    expect(calls.map((c) => c.elevation)).toEqual([null, 'elev-new'])
    unsubscribe()
  })

  it('403 ROOT_ADMIN_REQUIRED limpia el token y se lanza sin diálogo', async () => {
    rootLogin()
    elevate('elev-1')
    server.use(
      http.get(`${backendUrl}/users/`, () => respondApiError(403, 'ROOT_ADMIN_REQUIRED', 'Root admin access required')),
    )
    const prompt = answerPrompt('elev-new')

    const error = (await httpClient.get(`${backendUrl}/users/`).catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe('ROOT_ADMIN_REQUIRED')
    expect(rootElevationStore.getToken()).toBeNull()
    expect(prompt.seen).toEqual([])
    prompt.unsubscribe()
  })
})
