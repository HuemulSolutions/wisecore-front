import type { User } from '@/types/users'

export interface GlobalUsersResponse {
  data: User[]
  page: number
  page_size: number
  has_next: boolean
  total?: number
}
