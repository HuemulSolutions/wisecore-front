import type {
  EmbeddingProvider,
  EmbeddingProviderOption,
  SupportedEmbeddingProvider,
} from "@/types/embedding-provider"

/** Solo Azure OpenAI pide endpoint y deployment además de la clave. */
export function embeddingProviderRequiresAzureFields(name: string): boolean {
  return name === "azure_openai"
}

/** Combina los proveedores soportados con el que la organización tiene configurado. */
export function buildEmbeddingProviderOptions(
  supported: SupportedEmbeddingProvider[],
  configured: EmbeddingProvider | null,
): EmbeddingProviderOption[] {
  return supported.map((provider) => {
    const isAzure = embeddingProviderRequiresAzureFields(provider.name)
    return {
      name: provider.name,
      display: provider.display,
      isActive: configured?.name === provider.name,
      requiresEndpoint: isAzure,
      requiresDeployment: isAzure,
    }
  })
}
