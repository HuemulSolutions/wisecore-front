/**
 * Servicio de LLM por propósito: rutas y parseo de la respuesta del backend.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { clearLLMForPurpose, setLLMForPurpose } from '@/services/llms'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'

describe('services/llms · propósitos', () => {
  it('marca el LLM para un propósito y devuelve si encoló el análisis de imágenes', async () => {
    let path = ''
    server.use(
      http.patch(`${backendUrl}/llms/:llmId/set_default_for/:purpose`, ({ params }) => {
        path = `${params.llmId}/${params.purpose}`
        return respondOk({ id: 'llm-1', name: 'gpt-5.4', is_image_analysis_default: true, media_scan_enqueued: true })
      }),
    )
    const result = await setLLMForPurpose('llm-1', 'image_analysis')
    expect(path).toBe('llm-1/image_analysis')
    expect(result.media_scan_enqueued).toBe(true)
    expect(result.is_image_analysis_default).toBe(true)
  })

  it('quita el LLM del propósito', async () => {
    let purpose = ''
    server.use(
      http.delete(`${backendUrl}/llms/default_for/:purpose`, ({ params }) => {
        purpose = String(params.purpose)
        return HttpResponse.json({ data: { purpose, llm_id: null } })
      }),
    )
    await clearLLMForPurpose('rerank')
    expect(purpose).toBe('rerank')
  })
})
