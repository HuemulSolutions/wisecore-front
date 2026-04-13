import '@tanstack/react-query'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Message to show in a success toast after the mutation succeeds. */
      successMessage?: string
      /** Set to false to suppress the automatic success toast (default: true when successMessage is set). */
      showSuccessToast?: boolean
    }
  }
}
