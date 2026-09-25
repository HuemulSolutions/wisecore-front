import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type { QuestionTypesResponse } from "@/types/question-types";

// httpClient inyecta Authorization y X-Org-Id desde el contexto de
// organización activo (ver src/lib/http-client.ts); ningún servicio debe leer
// `selectedOrganizationId` de localStorage a mano (fuga cross-org tras un
// cambio de organización — ver ia context/rbac-audit-guide.md).

// Obtiene el catálogo de tipos de pregunta
export const getQuestionTypes = async (): Promise<QuestionTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/question_types/`);
  return response.json();
};
