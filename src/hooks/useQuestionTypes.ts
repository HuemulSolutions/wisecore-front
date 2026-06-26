import { useQuery } from "@tanstack/react-query";
import { getQuestionTypes } from "@/services/question-types";

export const questionTypesQueryKeys = {
  all: ["question-types"] as const,
};

export function useQuestionTypes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionTypesQueryKeys.all,
    queryFn: getQuestionTypes,
    enabled: options?.enabled !== false,
    staleTime: 30 * 60 * 1000, // 30 min — catálogo estable
  });
}
