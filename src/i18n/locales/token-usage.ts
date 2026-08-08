const translations = {
  header: {
    title: { en: "Usage & costs", es: "Uso y costos" },
  },
  period: {
    thisMonth: { en: "This month", es: "Este mes" },
    last3Months: { en: "Last 3 months", es: "Últimos 3 meses" },
    custom: { en: "Custom", es: "Personalizado" },
  },
  metrics: {
    tokensConsumed: { en: "Tokens consumed", es: "Tokens consumidos" },
    estimatedCost: { en: "Estimated cost", es: "Costo estimado" },
    estimatedCostSubtitle: { en: "USD this period", es: "USD este período" },
    partialCoverage: {
      en: "Partial pricing — some tokens have no price configured",
      es: "Cobertura parcial — algunos tokens no tienen precio configurado",
    },
    activeLlms: { en: "Active LLMs", es: "LLMs activos" },
    activeUsers: { en: "Active users", es: "Usuarios activos" },
    activeUsersSubtitle: { en: "with usage in this period", es: "con consumo en el rango" },
  },
  tabs: {
    byUser: { en: "By user", es: "Por usuario" },
    byDocumentType: { en: "By document type", es: "Por tipo de documento" },
    byDocument: { en: "By document", es: "Por documento" },
  },
  columns: {
    user: { en: "User", es: "Usuario" },
    tokens: { en: "Tokens", es: "Tokens" },
    cost: { en: "Total cost", es: "Costo total" },
    llms: { en: "LLM", es: "LLM" },
    percentage: { en: "% of total", es: "% del total" },
    consolidated: { en: "consolidated · {{count}} LLMs", es: "consolidado · {{count}} LLMs" },
    deletedUser: { en: "Deleted user", es: "Usuario eliminado" },
  },
  filters: {
    user: { en: "User", es: "Usuario" },
    userPlaceholder: { en: "Search user...", es: "Buscar usuario..." },
    llm: { en: "LLM", es: "LLM" },
    allLlms: { en: "All LLMs", es: "Todos los LLMs" },
  },
  breakdown: {
    title: { en: "Breakdown by LLM", es: "Desglose por LLM" },
    loadError: { en: "Couldn't load the breakdown", es: "No se pudo cargar el desglose" },
  },
  chart: {
    title: { en: "Total consumption", es: "Consumo total" },
    truncated: {
      en: "Showing a partial range — the historical data is larger than what's loaded",
      es: "Mostrando un rango parcial — el histórico es más extenso que lo cargado",
    },
  },
  emptyState: {
    title: { en: "No usage in this period", es: "Sin consumo en este período" },
    description: { en: "Try a wider date range or a different filter.", es: "Prueba un rango de fechas más amplio o un filtro distinto." },
  },
  errorState: {
    title: { en: "Couldn't load usage data", es: "No se pudieron cargar los datos de uso" },
  },
  comingSoon: {
    title: { en: "Coming soon", es: "Próximamente" },
    description: {
      en: "This breakdown isn't available yet.",
      es: "Este desglose todavía no está disponible.",
    },
  },
}

export default translations
