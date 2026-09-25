import { useMutation } from '@tanstack/react-query';
import { editWithAi } from '@/services/generate';
import type { EditWithAiParams } from '@/types/generate';

export function useEditWithAi() {
  return useMutation({
    mutationFn: (params: EditWithAiParams) => editWithAi(params),
    retry: 0,
  });
}
