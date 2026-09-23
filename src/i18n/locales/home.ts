const translations = {
  greeting: {
    morning: { en: "Good morning, {{name}}", es: "Buenos días, {{name}}" },
    afternoon: { en: "Good afternoon, {{name}}", es: "Buenas tardes, {{name}}" },
    evening: { en: "Good evening, {{name}}", es: "Buenas noches, {{name}}" },
    welcome: { en: "Welcome, {{name}}", es: "Bienvenido, {{name}}" },
    unreadNotifications: {
      en: "{{count}} unread notifications",
      es: "{{count}} notificaciones sin leer",
    },
  },

  actions: {
    uploadDocument: { en: "Upload Asset", es: "Subir Activo" },
    createAsset: { en: "Create Asset", es: "Crear Activo" },
    refreshing: { en: "Refreshing…", es: "Actualizando…" },
  },

  refreshed: { en: "Refreshed", es: "Actualizado" },

  // Subtítulo del saludo, armado en JSX a partir de fragmentos (mismo patrón
  // que ya usaba este archivo para "fecha · notificaciones sin leer") — no hay
  // Trans/i18nKey en el repo, así que el número en negrita se envuelve en un
  // <span> propio en vez de embeber markup en la traducción.
  subtitle: {
    pendingPrefix: { en: "You have", es: "Tienes" },
    pendingSuffix: { en: "pending", es: "pendientes" },
    // Conteo no exacto (`N+`): el número es un piso, no un total probado.
    pendingApproxSuffix: { en: "+ pending", es: "+ pendientes" },
    dueSoonSuffix: { en: "due this week", es: "vencen esta semana" },
    upToDate: { en: "You're all caught up", es: "Estás al día" },
    firstTime: {
      en: "Get your organization ready in {{count}} steps. Once assets are moving, you'll see here what you need to review, approve or publish.",
      es: "Deja tu organización lista en {{count}} pasos. Cuando haya activos en movimiento, aquí verás lo que te toca revisar, aprobar o publicar.",
    },
  },

  tabs: {
    myWork: { en: "My work", es: "Mi trabajo" },
    allAssets: { en: "All assets", es: "Todos los activos" },
    teamActivity: { en: "Team activity", es: "Actividad del equipo" },
  },

  commentsPopover: {
    open: { en: "View unresolved comments", es: "Ver comentarios sin resolver" },
    title: { en: "Comments", es: "Comentarios" },
    documentScope: { en: "Whole document", es: "Todo el documento" },
    unknownSection: { en: "Untitled section", es: "Sección sin título" },
    unknownAuthor: { en: "Unknown user", es: "Usuario desconocido" },
    empty: { en: "No unresolved comments", es: "No hay comentarios sin resolver" },
    error: { en: "Could not load the comments.", es: "No se pudieron cargar los comentarios." },
    viewFullAsset: { en: "View full asset", es: "Ver activo completo" },
  },

  workGroups: {
    approved: {
      title: { en: "Yours, approved and ready to publish", es: "Tus aprobados, listos para publicar" },
      meta: { en: "Only publishing is left", es: "Solo falta publicarlos" },
      empty: { en: "You have no assets pending publication", es: "No tienes activos pendientes de publicar" },
      actionPublish: { en: "Publish", es: "Publicar" },
    },
    review: {
      title: { en: "Awaiting your review", es: "Esperan tu revisión" },
      meta: { en: "Oldest first", es: "Más antiguos primero" },
      empty: { en: "You have no pending reviews", es: "No tienes revisiones pendientes" },
      // Sin botones inline todavía — backend entregó `lifecycle_permissions`
      // por fila pero no `lifecycle_status` (can_advance/can_rollback/
      // advance_blockers), que es lo que hace falta para decidir qué botón
      // pintar. Claves listas para cuando se resuelva (ver
      // respuestas/spec-home-lifecycle-status-por-fila.md).
      actionSecondary: { en: "Return", es: "Devolver" },
      actionPrimary: { en: "Review", es: "Revisar" },
    },
    approval: {
      title: { en: "Awaiting your approval", es: "Esperan tu aprobación" },
      meta: { en: "By publication date", es: "Por fecha de publicación" },
      empty: { en: "You have no pending approvals", es: "No tienes aprobaciones pendientes" },
      actionSecondary: { en: "Reject", es: "Rechazar" },
      actionPrimary: { en: "Approve", es: "Aprobar" },
    },
    mentions: {
      title: { en: "Comments mentioning you", es: "Comentarios que te mencionan" },
      meta: { en: "Sorted by recency", es: "Ordenado por recencia" },
      actionPrimary: { en: "Reply", es: "Responder" },
    },
    common: {
      viewRemaining: { en: "View the {{count}} remaining in All assets", es: "Ver los {{count}} restantes en Todos los activos" },
      viewRemainingOne: { en: "View the remaining one in All assets", es: "Ver el restante en Todos los activos" },
      open: { en: "Open", es: "Abrir" },
      published: { en: "Published: {{name}}", es: "Publicado: {{name}}" },
      showingOf: { en: "Showing 2 of {{count}}", es: "Mostrando 2 de {{count}}" },
      viewAll: { en: "View all", es: "Ver todas" },
      countApprox: { en: "{{count}}+", es: "{{count}}+" },
      collapse: { en: "Collapse", es: "Colapsar" },
      expand: { en: "Expand", es: "Expandir" },
      errorTitle: {
        en: "We couldn't load this group. The others are still up to date.",
        es: "No pudimos cargar este grupo. Los demás siguen al día.",
      },
      // Una variante por cubo de `getRelativeTimeBucket` — la frase se arma
      // entera acá (no se concatena `formatRelativeTime`, que ya trae
      // "Ayer"/"hace 3m" redactado y daba "esperando hace Ayer").
      updatedAgo: {
        justNow: { en: "updated just now", es: "actualizado hace un momento" },
        minutes: { en: "updated {{count}}m ago", es: "actualizado hace {{count}}m" },
        hours: { en: "updated {{count}}h ago", es: "actualizado hace {{count}}h" },
        yesterday: { en: "updated yesterday", es: "actualizado ayer" },
        date: { en: "updated on {{date}}", es: "actualizado el {{date}}" },
      },
      // `lifecycle_state_since` — entrada al estado actual, distinto de
      // `updatedAgo` (última edición de contenido). Ver spec Punto 6.
      pendingSince: {
        justNow: { en: "waiting since just now", es: "en espera desde hace un momento" },
        minutes: { en: "waiting for {{count}}m", es: "en espera desde hace {{count}}m" },
        hours: { en: "waiting for {{count}}h", es: "en espera desde hace {{count}}h" },
        yesterday: { en: "waiting since yesterday", es: "en espera desde ayer" },
        date: { en: "waiting since {{date}}", es: "en espera desde el {{date}}" },
      },
      publishesOn: { en: "publishes on {{date}}", es: "publica el {{date}}" },
    },
  },

  rail: {
    overview: {
      title: { en: "Overview", es: "Panorama" },
      scopeOrganization: { en: "Organization", es: "Organización" },
      scopeMine: { en: "For you", es: "Para ti" },
      hintDefault: { en: "Click an indicator to filter the table", es: "Clic en un indicador para filtrar la tabla" },
      hintActive: { en: "Filter applied · click again to remove it", es: "Filtro aplicado · clic de nuevo para quitarlo" },
      hintReadOnly: { en: "Read-only: you can't access the asset list", es: "Solo consulta: no tienes acceso a la lista de activos" },
      errorFallback: { en: "Couldn't load the overview", es: "No se pudo cargar el panorama" },
      unavailable: {
        title: { en: "Overview not available", es: "Panorama no disponible" },
        description: {
          en: "Your role doesn't include organization statistics. Your pending work is still complete.",
          es: "Tu rol no incluye las estadísticas de la organización. Tu trabajo pendiente sigue completo.",
        },
      },
    },
    continue: {
      title: { en: "Continue where you left off", es: "Continuar donde quedaste" },
      subtitle: { en: "Latest assets you edited", es: "Últimos activos que editaste" },
      viewAll: { en: "View all your recent activity", es: "Ver toda tu actividad reciente" },
    },
    gettingStarted: {
      title: { en: "Getting started", es: "Puesta en marcha" },
      // Sin estimación de tiempo fija: configurar credenciales de un
      // proveedor de LLM/embeddings no entra en un cálculo de minutos
      // confiable como sí lo hacían los otros pasos.
      stepCount: { en: "{{done}} of {{total}}", es: "{{done}} de {{total}}" },
      // Banner compacto (checklist oculta, primera vez) y link del rail.
      hiddenBanner: { en: "{{done}} of {{total}} · missing: {{step}}", es: "{{done}} de {{total}} · falta: {{step}}" },
      hiddenLink: { en: "Getting started hidden · {{done}} of {{total}} · Resume", es: "Puesta en marcha oculta · {{done}} de {{total}} · Retomar" },
      hide: { en: "Hide for now", es: "Ocultar por ahora" },
      resume: { en: "Resume", es: "Retomar" },
      done: { en: "Done", es: "Listo" },
      adminOnly: { en: "Set up by an administrator", es: "Lo configura un administrador" },
      steps: {
        defaultLlm: {
          title: { en: "Choose the default language model", es: "Elige el modelo de lenguaje por defecto" },
          description: {
            en: "Used by assisted writing and asset summaries",
            es: "Lo usan la redacción asistida y los resúmenes de activos",
          },
          action: { en: "Choose", es: "Elegir" },
        },
        embeddingProvider: {
          title: { en: "Connect an embeddings provider", es: "Conecta un proveedor de embeddings" },
          description: {
            en: "Enables semantic search over content",
            es: "Habilita la búsqueda semántica sobre el contenido",
          },
          action: { en: "Connect", es: "Conectar" },
        },
        assetType: {
          title: { en: "Define your first asset type", es: "Define tu primer tipo de activo" },
          description: {
            en: "The fields and lifecycle your documents will follow",
            es: "Los campos y el ciclo de vida que seguirán tus documentos",
          },
          action: { en: "Define", es: "Definir" },
        },
        firstAsset: {
          title: { en: "Create or upload your first asset", es: "Crea o sube tu primer activo" },
          description: {
            en: "From a template or by importing an existing file",
            es: "Desde una plantilla o importando un archivo existente",
          },
          action: { en: "Create", es: "Crear" },
        },
        inviteTeam: {
          title: { en: "Invite your team", es: "Invita a tu equipo" },
          description: {
            en: "Assign who reviews and who approves so the flow moves forward",
            es: "Asigna quién revisa y quién aprueba para que el flujo avance",
          },
          action: { en: "Invite", es: "Invitar" },
        },
      },
    },
  },

  emptyState: {
    firstTime: {
      title: { en: "You have nothing pending yet", es: "Todavía no tienes nada pendiente" },
      description: {
        en: "Once your team starts moving assets, this list sorts itself into three groups:",
        es: "Cuando tu equipo empiece a mover activos, esta lista se ordena sola en tres grupos:",
      },
      groups: {
        review: { title: { en: "Awaiting your review", es: "Esperan tu revisión" }, subtitle: { en: "You were assigned as reviewer", es: "Te asignaron como revisor" } },
        approval: { title: { en: "Awaiting your approval", es: "Esperan tu aprobación" }, subtitle: { en: "Your signature decides if it moves on", es: "Tu firma decide si avanza" } },
        approved: { title: { en: "Your approved assets", es: "Tus aprobados" }, subtitle: { en: "Only publishing is left", es: "Solo falta que los publiques" } },
      },
    },
    noPending: {
      title: { en: "You're all caught up", es: "Estás al día" },
      description: {
        en: "You have no reviews or approvals waiting, and nothing of yours approved and unpublished. If something is assigned to you, it will show up here.",
        es: "No tienes revisiones ni aprobaciones esperándote, y nada tuyo aprobado sin publicar. Si te asignan algo, aparece aquí.",
      },
      explore: { en: "Explore all assets", es: "Explorar todos los activos" },
      create: { en: "Create asset", es: "Crear activo" },
    },
  },

  // Aviso cuando la UI descarta un filtro incompatible (el backend responde
  // 400 PENDING_MY_ACTION_WITH_SEARCH_NOT_SUPPORTED si llegan juntos).
  filterNotice: {
    droppedPending: {
      en: "We removed “{{label}}”: that filter can't be combined with a text search. Clear the search to apply it again.",
      es: "Quitamos «{{label}}»: ese filtro no se puede combinar con una búsqueda de texto. Borra la búsqueda para volver a aplicarlo.",
    },
    droppedQuery: {
      en: "We removed the search “{{query}}”: “{{label}}” can't be combined with a text search.",
      es: "Quitamos la búsqueda «{{query}}»: «{{label}}» no se puede combinar con búsqueda de texto.",
    },
    dismiss: { en: "Got it", es: "Entendido" },
  },

  noResults: {
    titleOne: { en: "No asset matches this filter", es: "Ningún activo cumple este filtro" },
    titleMany: { en: "No asset matches these {{count}} filters", es: "Ningún activo cumple estos {{count}} filtros" },
    description: {
      en: "Remove the filter that restricts the most or broaden the search.",
      es: "Quita el filtro que más restringe o amplía la búsqueda.",
    },
    searchInContent: { en: "Search “{{query}}” in content", es: "Buscar «{{query}}» en el contenido" },
    clearFilters: { en: "Clear filters", es: "Limpiar filtros" },
  },

  orgEmpty: {
    title: { en: "The organization has no assets yet", es: "La organización todavía no tiene activos" },
    descriptionCreate: {
      en: "Create one from a template or upload an existing file. It will show up here and in the Overview.",
      es: "Crea uno desde una plantilla o sube un archivo existente. Aparecerá aquí y en el Panorama.",
    },
    descriptionReadOnly: {
      en: "When someone in your organization creates an asset, it will show up here.",
      es: "Cuando alguien de tu organización cree un activo, aparecerá aquí.",
    },
    upload: { en: "Upload file", es: "Subir archivo" },
    create: { en: "Create asset", es: "Crear activo" },
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
    pendingMyAction: { en: "Pending your action", es: "Pendientes de tu acción" },
    allPendingMyAction: { en: "All", es: "Todas" },
    pendingMyActionReview: { en: "Awaiting your review", es: "Esperando tu revisión" },
    pendingMyActionApprove: { en: "Awaiting your approval", es: "Esperando tu aprobación" },
    pendingMyActionAny: { en: "Awaiting your review or approval", es: "Esperando tu revisión o aprobación" },
    ownerScope: { en: "Owner", es: "Propietario" },
    allOwners: { en: "All owners", es: "Todos los propietarios" },
    ownerAll: { en: "All", es: "Todos" },
    ownerMe: { en: "Me", es: "Yo" },
    ownerMeDescription: { en: "Assets you own", es: "Activos propios" },
    ownerScopeLabel: { en: "Quick filters", es: "Filtros rápidos" },
    ownerUsersLabel: { en: "Specific user", es: "Usuario específico" },
    ownerSpecific: { en: "Specific user", es: "Usuario específico" },
    ownerSpecificPlaceholder: { en: "Search user...", es: "Buscar usuario..." },
    pendingAiSuggestion: { en: "AI Suggestions", es: "Sugerencias IA" },
    unresolvedComments: { en: "Unresolved Comments", es: "Con comentarios sin resolver" },
    expiringSoon: { en: "Expiring soon", es: "Próximos a expirar" },
    documentType: { en: "Asset Type", es: "Tipo de Activo" },
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
      label: { en: "Assets you own", es: "Activos propios" },
    },
    draft: {
      label: { en: "In elaboration", es: "En elaboración" },
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
    // Bloque "Solo lo mío" — `scope=me` de `GET /documents/statistics`.
    pendingMyReview: {
      label: { en: "Awaiting your review", es: "Esperan tu revisión" },
    },
    pendingMyApproval: {
      label: { en: "Awaiting your approval", es: "Esperan tu aprobación" },
    },
    approvedOwnedByMe: {
      label: { en: "Approved, yours", es: "Aprobados tuyos" },
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
      description: { en: "Create an asset and run a version to see it here.", es: "Crear un activo y generar una versión para verla aquí." },
    },
    resultsCount: { en: "{{count}} assets found", es: "{{count}} activos encontrados" },
    you: { en: "You", es: "Tú" },
    actions: {
      openAsset: { en: "Open asset", es: "Abrir activo" },
    },
  },
}

export default translations
