export interface AuthType {
  id: string;
  name: string;
  type: 'internal' | 'entra';
  params: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAuthTypeRequest {
  name: string;
  type: 'internal' | 'entra';
  params?: Record<string, unknown> | null;
}

export interface UpdateAuthTypeRequest {
  name: string;
  type: 'internal' | 'entra';
  params?: Record<string, unknown> | null;
}

export interface AuthTypesResponse {
  data: AuthType[];
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeResponse {
  data: AuthType;
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeTypesResponse {
  data: string[];
  transaction_id: string;
  timestamp: string;
}
