const translations = {
  greeting: {
    morning: { en: "Good morning, {{name}}", es: "Buenos días, {{name}}" },
    afternoon: { en: "Good afternoon, {{name}}", es: "Buenas tardes, {{name}}" },
    evening: { en: "Good evening, {{name}}", es: "Buenas noches, {{name}}" },
    unreadNotifications: {
      en: "{{count}} unread notifications",
      es: "{{count}} notificaciones sin leer",
    },
  },

  actions: {
    uploadDocument: { en: "Upload Document", es: "Subir Documento" },
    pendingReviews: { en: "Pending Reviews", es: "Revisiones Pendientes" },
    createAsset: { en: "Create Asset", es: "Crear Activo" },
    pendingReviewsTitle: { en: "Pending Reviews", es: "Revisiones Pendientes" },
    pendingReviewsDescription: {
      en: "Documents with pending AI suggestions awaiting review.",
      es: "Documentos con sugerencias de IA pendientes de revisión.",
    },
  },

  filters: {
    title: { en: "Filters", es: "Filtros" },
    search: { en: "Search", es: "Búsqueda" },
    searchPlaceholder: { en: "Search...", es: "Buscar..." },
    searchType: { en: "Search type", es: "Tipo de búsqueda" },
    searchTypeDefault: { en: "Default (semantic)", es: "Por defecto (semántica)" },
    searchTypeSemantic: { en: "Semantic", es: "Semántica" },
    searchTypeTitle: { en: "Title", es: "Título" },
    searchTypeCode: { en: "Code", es: "Código" },
    searchTypeContent: { en: "Content", es: "Contenido" },
    lifecycleState: { en: "Lifecycle", es: "Ciclo de Vida" },
    allLifecycleStates: { en: "All states", es: "Todos los estados" },
    ownerScope: { en: "Owner", es: "Propietario" },
    allOwners: { en: "All owners", es: "Todos los propietarios" },
    ownerAll: { en: "All", es: "Todos" },
    ownerMe: { en: "Me", es: "Yo" },
    ownerMeDescription: { en: "Documents you own", es: "Documentos de tu autoría" },
    ownerScopeLabel: { en: "Quick filters", es: "Filtros rápidos" },
    ownerUsersLabel: { en: "Specific user", es: "Usuario específico" },
    ownerSpecific: { en: "Specific user", es: "Usuario específico" },
    ownerSpecificPlaceholder: { en: "Search user...", es: "Buscar usuario..." },
    pendingAiSuggestion: { en: "AI Suggestions", es: "Sugerencias IA" },
    unresolvedComments: { en: "Unresolved Comments", es: "Con comentarios sin resolver" },
    expiringSoon: { en: "Expiring soon", es: "Próximos a expirar" },
    documentType: { en: "Document Type", es: "Tipo de Documento" },
    allDocumentTypes: { en: "All types", es: "Todos los tipos" },
    expirationDate: { en: "Expiration Date", es: "Fecha de Expiración" },
    expirationDateFrom: { en: "Exp. from", es: "Exp. desde" },
    expirationDateTo: { en: "Exp. to", es: "Exp. hasta" },
    estimatedPublicationDate: { en: "Est. Publication Date", es: "Fecha Est. de Publicación" },
    estimatedPublicationDateFrom: { en: "Est. pub. from", es: "Est. pub. desde" },
    estimatedPublicationDateTo: { en: "Est. pub. to", es: "Est. pub. hasta" },
    reviewDate: { en: "Review Date", es: "Fecha de Revisión" },
    reviewDateFrom: { en: "Review from", es: "Revisión desde" },
    reviewDateTo: { en: "Review to", es: "Revisión hasta" },
    auditDate: { en: "Audit Date", es: "Fecha de Auditoría" },
    auditDateFrom: { en: "Audit from", es: "Auditoría desde" },
    auditDateTo: { en: "Audit to", es: "Auditoría hasta" },
    all: { en: "All", es: "Todos" },
    customFieldsGroup: { en: "Custom Fields", es: "Campos Personalizados" },
    customFields: { en: "Custom Fields", es: "Campos personalizados" },
    customFieldsPlaceholder: { en: "Search field...", es: "Buscar campo..." },
  },

  kpis: {
    owned: {
      label: { en: "Assets you own", es: "Activos de tu autoría" },
    },
    draft: {
      label: { en: "In elaboration (draft)", es: "En elaboración (borrador)" },
    },
    inReview: {
      label: { en: "Awaiting review", es: "Esperando revisión" },
    },
    inApproval: {
      label: { en: "Pending approval", es: "Pendientes de aprobación" },
    },
    approved: {
      label: { en: "Approved, not yet published", es: "Aprobados, sin publicar" },
    },
    published: {
      label: { en: "Currently published", es: "Publicados actualmente" },
    },
    expiringSoon: {
      label: { en: "Expiring in the next 7 days", es: "Vencen en los próximos 7 días" },
    },
    unresolvedComments: {
      label: { en: "With unresolved comments", es: "Con comentarios sin resolver" },
    },
  },

  executionsTable: {
    title: { en: "Recent Executions", es: "Ejecuciones Recientes" },
    columns: {
      documentName: { en: "Asset", es: "Activo" },
      version: { en: "Version", es: "Versión" },
      lifecycleState: { en: "Lifecycle", es: "Ciclo de Vida" },
      taskStatus: { en: "Task Status", es: "Estado de Tarea" },
      owner: { en: "Owner", es: "Propietario" },
      totalTokens: { en: "Tokens", es: "Tokens" },
      updatedAt: { en: "Last Modified", es: "Última Modificación" },
      expirationDate: { en: "Expiration Date", es: "Fecha de Expiración" },
      estimatedPublicationDate: { en: "Est. Publication Date", es: "Fecha Est. de Publicación" },
      reviewDate: { en: "Review Date", es: "Fecha de Revisión" },
      auditDate: { en: "Audit Date", es: "Fecha de Auditoría" },
      unresolvedComments: { en: "Comments", es: "Comentarios" },
    },
    status: {
      completed: { en: "Completed", es: "Completado" },
      failed: { en: "Failed", es: "Fallido" },
      running: { en: "Running", es: "En ejecución" },
      queued: { en: "Queued", es: "En cola" },
    },
    empty: {
      title: { en: "No executions found", es: "No se encontraron ejecuciones" },
      description: { en: "Create an asset and run a version to see it here.", es: "Crea un activo y genera una versión para verla aquí." },
    },
    resultsCount: { en: "{{count}} assets found", es: "{{count}} activos encontrados" },
    actions: {
      openAsset: { en: "Open asset", es: "Abrir activo" },
    },
  },
}

export default translations
