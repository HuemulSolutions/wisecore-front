import type {
  EmbeddingProvider,
  EmbeddingProviderOption,
  EmbeddingProviderSlot,
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

/** Cobertura de vectores 0..1, o null si todavía no hay contenido indexado. */
export function coverageOf(provider: EmbeddingProviderSlot): number | null {
  if (provider.coverage_ratio != null) return provider.coverage_ratio
  const total = provider.chunks_total ?? 0
  if (!total) return null
  return Math.min((provider.chunks_with_vectors ?? 0) / total, 1)
}

/** Listo para comparar o promover: índice construido y vectores para todo el contenido. */
export function isProviderComplete(provider: EmbeddingProviderSlot): boolean {
  const coverage = coverageOf(provider)
  return provider.index_status === 'ready' && (coverage == null || coverage >= 1)
}
