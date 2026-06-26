import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type { QuestionTypesResponse } from "@/types/question-types";

const getOrganizationId = (): string | null =>
  localStorage.getItem("selectedOrganizationId");

const getHeaders = (): Record<string, string> => {
  const orgId = getOrganizationId();
  return orgId ? { "X-Org-Id": orgId } : {};
};

// Obtiene el catálogo de tipos de pregunta
export const getQuestionTypes = async (): Promise<QuestionTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/question_types/`, {
    headers: getHeaders(),
  });
  return response.json();
};
