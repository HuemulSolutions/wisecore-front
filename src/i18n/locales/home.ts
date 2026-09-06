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
  },

  // Subtítulo del saludo, armado en JSX a partir de fragmentos (mismo patrón
  // que ya usaba este archivo para "fecha · notificaciones sin leer") — no hay
  // Trans/i18nKey en el repo, así que el número en negrita se envuelve en un
  // <span> propio en vez de embeber markup en la traducción.
  subtitle: {
    pendingPrefix: { en: "You have", es: "Tienes" },
    // "N cosas por hacer" — cuenta interina, ver homeWorkGroupCounts.ts.
    pendingSuffix: { en: "things to do", es: "cosas por hacer" },
    // Se usa cuando el conteo del grupo real es indeterminado (has_next=true,
    // spec Punto 2 pendiente) — no se fuerza un número que no se puede probar.
    pendingUnknown: { en: "You have pending work", es: "Tienes trabajo pendiente" },
    dueSoonSuffix: { en: "due this week", es: "vencen esta semana" },
  },

  tabs: {
    myWork: { en: "My work", es: "Mi trabajo" },
    allAssets: { en: "All assets", es: "Todos los activos" },
    teamActivity: { en: "Team activity", es: "Actividad del equipo" },
  },

  workGroups: {
    approved: {
      title: { en: "Approved, ready to publish", es: "Aprobados, listos para publicar" },
      meta: { en: "Sorted by publication date", es: "Ordenado por fecha de publicación" },
      empty: { en: "No assets waiting to publish", es: "Sin activos pendientes de publicar" },
      actionPublish: { en: "Publish", es: "Publicar" },
    },
    review: {
      title: { en: "Awaiting your review", es: "Esperando tu revisión" },
      meta: { en: "Sorted by time waiting", es: "Ordenado por antigüedad" },
      empty: { en: "Nothing waiting for your review", es: "Nada esperando tu revisión" },
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
      meta: { en: "Sorted by time waiting", es: "Ordenado por antigüedad" },
      empty: { en: "Nothing waiting for your approval", es: "Nada esperando tu aprobación" },
      actionSecondary: { en: "Reject", es: "Rechazar" },
      actionPrimary: { en: "Approve", es: "Aprobar" },
    },
    mentions: {
      title: { en: "Comments mentioning you", es: "Comentarios que te mencionan" },
      meta: { en: "Sorted by recency", es: "Ordenado por recencia" },
      actionPrimary: { en: "Reply", es: "Responder" },
    },
    common: {
      viewRemaining: { en: "View {{count}} more", es: "Ver las {{count}} restantes" },
      viewAll: { en: "View all", es: "Ver todas" },
      countApprox: { en: "{{count}}+", es: "{{count}}+" },
      collapse: { en: "Collapse", es: "Colapsar" },
      expand: { en: "Expand", es: "Expandir" },
      errorTitle: { en: "We couldn't load this group", es: "No pudimos cargar este grupo" },
      updatedAgo: { en: "updated {{time}}", es: "hace {{time}}" },
      // `lifecycle_state_since` — entrada al estado actual, distinto de
      // `updatedAgo` (última edición de contenido). Ver spec Punto 6.
      pendingSince: { en: "waiting {{time}}", es: "esperando hace {{time}}" },
      publishesOn: { en: "publishes on {{date}}", es: "publica el {{date}}" },
      undoUnavailable: {
        en: "Done. This action can't be undone yet.",
        es: "Listo. Esta acción todavía no se puede deshacer.",
      },
    },
  },

  rail: {
    overview: {
      title: { en: "Overview", es: "Panorama" },
      scopeOrganization: { en: "Organization", es: "Organización" },
      scopeMine: { en: "Just mine", es: "Solo lo mío" },
    },
    continue: {
      title: { en: "Continue where you left off", es: "Continuar donde quedaste" },
    },
    gettingStarted: {
      title: { en: "Getting started", es: "Puesta en marcha" },
      // Sin estimación de tiempo fija: configurar credenciales de un
      // proveedor de LLM/embeddings no entra en un cálculo de minutos
      // confiable como sí lo hacían los otros pasos.
      stepCount: { en: "{{done}} of {{total}}", es: "{{done}} de {{total}}" },
      subtitle: {
        en: "{{count}} steps and your organization is operational. This card disappears once completed.",
        es: "{{count}} pasos y tu organización queda operativa. Esta tarjeta desaparece al completarlos.",
      },
      dismissBanner: { en: "Getting started · {{done}} of {{total}} · Continue", es: "Puesta en marcha · {{done}} de {{total}} · Continuar" },
      steps: {
        defaultLlm: {
          title: { en: "Set up your default LLM", es: "Configura tu LLM predeterminado" },
          description: {
            en: "The AI model that generation and assistance features will use",
            es: "El modelo de IA que van a usar las funcionalidades de generación y asistencia",
          },
          action: { en: "Configure", es: "Configurar" },
        },
        embeddingProvider: {
          title: { en: "Set up your embedding provider", es: "Configura el proveedor de embeddings" },
          description: {
            en: "Needed for semantic search and similarity-based AI features",
            es: "Necesario para la búsqueda semántica y las funcionalidades de IA que dependen de similitud",
          },
          action: { en: "Configure", es: "Configurar" },
        },
        assetType: {
          title: { en: "Define your first asset type", es: "Define tu primer tipo de activo" },
          description: {
            en: "The fields and lifecycle your documents will follow",
            es: "Los campos y el ciclo de vida que van a seguir tus documentos",
          },
          action: { en: "Define", es: "Definir" },
        },
        firstAsset: {
          title: { en: "Create or upload your first asset", es: "Crea o sube tu primer activo" },
          description: {
            en: "Start from a template or import an existing file",
            es: "Empieza desde una plantilla o importa un archivo existente",
          },
          action: { en: "Create", es: "Crear" },
        },
        inviteTeam: {
          title: { en: "Invite your team", es: "Invita a tu equipo" },
          description: {
            en: "Assign review and approval roles so the flow works",
            es: "Asigna roles de revisión y aprobación para que el flujo funcione",
          },
          action: { en: "Invite", es: "Invitar" },
        },
      },
    },
  },

  emptyState: {
    firstTime: {
      title: { en: "Your pending work will show up here", es: "Aquí verás tu trabajo pendiente" },
      description: {
        en: "Reviews, approvals and comments appear in this list as soon as your team starts moving assets.",
        es: "Revisiones, aprobaciones y comentarios aparecen en esta lista en cuanto tu equipo empiece a mover activos.",
      },
    },
    noPending: {
      title: { en: "Nothing pending", es: "No tienes nada pendiente" },
      description: { en: "Explore the organization's assets", es: "Explora los activos de la organización" },
      cta: { en: "View all assets", es: "Ver todos los activos" },
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
    pendingMyAction: { en: "Pending my action", es: "Pendientes de mi acción" },
    allPendingMyAction: { en: "All", es: "Todas" },
    pendingMyActionReview: { en: "Awaiting my review", es: "Esperando mi revisión" },
    pendingMyActionApprove: { en: "Awaiting my approval", es: "Esperando mi aprobación" },
    pendingMyActionAny: { en: "Awaiting my review or approval", es: "Esperando mi revisión o aprobación" },
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
    actions: {
      openAsset: { en: "Open asset", es: "Abrir activo" },
    },
  },
}

export default translations
