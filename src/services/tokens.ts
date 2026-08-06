import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Token,
  TokenResponse,
  TokensResponse,
  GetTokensParams,
  CreateTokenRequest,
} from '@/types/tokens'

const BASE_URL = `${backendUrl}/tokens`

export async function getTokens(
  organizationId: string,
  params: GetTokensParams = {},
): Promise<TokensResponse> {
  const { page = 1, page_size = 100, search } = params
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<TokensResponse>
}

export async function getToken(
  organizationId: string,
  tokenId: string,
): Promise<Token> {
  const response = await httpClient.get(`${BASE_URL}/${tokenId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as TokenResponse
  return data.data
}

export async function createToken(
  organizationId: string,
  body: CreateTokenRequest,
): Promise<Token> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as TokenResponse
  return data.data
}

export type { Token, TokensResponse }
