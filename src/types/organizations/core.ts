/** Método de autenticación asignado a una membresía (docs/sso-frontend.md, Fase 6). */
export interface MembershipAuthType {
  id: string;
  name: string;
  /** `internal` | `microsoft` | `google` (mismos valores que `AuthType.type`). */
  type: string;
}

export interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  status: string;
  is_org_admin: boolean;
  /** Ausente en backends anteriores al SSO; `null` en membresías legacy sin método. */
  auth_type_id?: string | null;
  auth_type?: MembershipAuthType | null;
}

export interface OrganizationUsersResponse {
  transaction_id: string;
  data: OrganizationUser[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface SetOrganizationAdminResponse {
  transaction_id: string;
  data: {
    organization_id: string;
    user_id: string;
    message: string;
  };
}
