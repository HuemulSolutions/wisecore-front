import type { ReactNode } from 'react'

export interface EditorErrorBoundaryProps {
  children: ReactNode;
}

export interface EditorErrorBoundaryState {
  hasError: boolean;
}
