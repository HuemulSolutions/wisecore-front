const translations = {
  header: {
    title: { en: "Workflow", es: "Workflow" },
  },
  filters: {
    search: { en: "Search", es: "Búsqueda" },
    searchPlaceholder: { en: "Search by name or code...", es: "Buscar por nombre o código..." },
    documentType: { en: "Document Type", es: "Tipo de Documento" },
    allDocumentTypes: { en: "All document types", es: "Todos los tipos de documento" },
    lifecycleState: { en: "Lifecycle", es: "Ciclo de Vida" },
    allLifecycleStates: { en: "All states", es: "Todos los estados" },
    ownerScope: { en: "Owner", es: "Propietario" },
    allOwners: { en: "All owners", es: "Todos los propietarios" },
    ownerMe: { en: "Me", es: "Yo" },
    ownerMeDescription: { en: "Documents you own", es: "Documentos de tu autoría" },
    ownerScopeLabel: { en: "Quick filters", es: "Filtros rápidos" },
    ownerUsersLabel: { en: "Specific user", es: "Usuario específico" },
    template: { en: "Workflow template", es: "Template de workflow" },
    allTemplates: { en: "All templates", es: "Todos los templates" },
    expirationDate: { en: "Expiration Date", es: "Fecha de Expiración" },
    estimatedPublicationDate: { en: "Est. Publication Date", es: "Fecha Est. de Publicación" },
    reviewDate: { en: "Review Date", es: "Fecha de Revisión" },
    auditDate: { en: "Audit Date", es: "Fecha de Auditoría" },
    pendingAiSuggestion: { en: "AI Suggestions", es: "Sugerencias IA" },
    unresolvedComments: { en: "Unresolved Comments", es: "Con comentarios sin resolver" },
    expiringSoon: { en: "Expiring soon", es: "Próximos a expirar" },
    customFieldsGroup: { en: "Custom Fields", es: "Campos Personalizados" },
    customFields: { en: "Custom Fields", es: "Campos personalizados" },
  },
  columns: {
    internalCode: { en: "Code", es: "Código" },
    documentName: { en: "Asset", es: "Activo" },
    template: { en: "Workflow", es: "Workflow" },
    lifecycleState: { en: "State", es: "Estado" },
    progress: { en: "Progress", es: "Progreso" },
    currentStep: { en: "Current step", es: "Paso actual" },
    lastModified: { en: "Last modified", es: "Última modificación" },
  },
  emptyState: {
    empty: { en: "You don't have any assets in progress yet", es: "Aún no tienes activos en curso" },
    emptyDescription: { en: "Start a workflow to see it here", es: "Inicia un workflow para verlo aquí" },
    noResults: { en: "No assets found", es: "No se encontraron activos" },
    noResultsDescription: {
      en: "No assets in progress match your search",
      es: "No hay activos en curso que coincidan con tu búsqueda",
    },
  },
  actions: {
    share: { en: "Share", es: "Compartir" },
  },
  deleteDialog: {
    title: { en: "Delete workflow item", es: "Eliminar elemento de workflow" },
    description: {
      en: "Are you sure you want to delete \"{{name}}\"? This deletes the asset and all its answers. This action cannot be undone.",
      es: "¿Seguro que deseas eliminar \"{{name}}\"? Esto elimina el activo y todas sus respuestas. Esta acción no se puede deshacer.",
    },
    success: { en: "Workflow item deleted", es: "Elemento de workflow eliminado" },
  },
  panel: {
    noSelection: { en: "Select a row to view its form fields", es: "Selecciona una fila para ver los campos del formulario" },
    noCurrentStep: { en: "This item has no current step", es: "Este elemento no tiene un paso actual" },
    sectionNotFound: { en: "Section not found in the document content", es: "No se encontró la sección en el contenido del documento" },
    loadError: { en: "Failed to load the form fields", es: "Error al cargar los campos del formulario" },
    edit: { en: "Edit asset", es: "Editar activo" },
  },
  availableTemplates: {
    title: { en: "Available workflows", es: "Workflows disponibles" },
    start: { en: "Start", es: "Iniciar" },
    hide: { en: "Hide", es: "Ocultar" },
    show: { en: "Show", es: "Mostrar" },
    previousPage: { en: "Previous workflows", es: "Workflows anteriores" },
    nextPage: { en: "Next workflows", es: "Workflows siguientes" },
  },
  expressSheet: {
    welcomeTitle: { en: "General information", es: "Datos generales" },
    welcomeDescription: { en: "Assign a name to this asset to easily identify it later.", es: "Asigna un nombre a este activo para identificarlo fácilmente más adelante." },
    name: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "e.g. Ergonomic chairs purchase", es: "Ej: Compra de sillas ergonómicas" },
    description: { en: "Description", es: "Descripción" },
    descriptionPlaceholder: { en: "Add a description about this asset", es: "Agrega una descripción sobre este activo" },
    success: { en: "Document created successfully", es: "Documento creado correctamente" },
  },
  wizard: {
    back: { en: "Back", es: "Atrás" },
    finish: { en: "Finish", es: "Finalizar" },
    emptyStep: {
      title: { en: "Nothing to complete here", es: "Nada que completar acá" },
      advanceDescription: {
        en: "There are no pending forms for you at this step. You can move the workflow forward.",
        es: "No hay formularios pendientes para vos en este paso. Podés avanzar el flujo.",
      },
      waitingDescription: {
        en: "There are no pending forms for you at this step. Waiting on another role to continue.",
        es: "No hay formularios pendientes para vos en este paso. Falta que otro rol continúe el flujo.",
      },
    },
    summary: {
      tooltip: { en: "Back to summary", es: "Volver al resumen" },
      // answeredCount vive en sections:form.fill.answeredCount (compartido con el modo lector del asset).
      missingRequired: { en: "{{count}} required pending", es: "{{count}} obligatorias pendientes" },
      goToSection: { en: "Go to section", es: "Ir a la sección" },
      noAnswers: { en: "No answers in this section yet", es: "Esta sección aún no tiene respuestas" },
      sectionsAnswered: { en: "{{answered}} of {{total}} sections answered", es: "{{answered}} de {{total}} secciones respondidas" },
      questionsCount: { en: "{{answered}}/{{total}} questions", es: "{{answered}}/{{total}} preguntas" },
    },
  },
  share: {
    dialogTitle: { en: "Share this workflow with your team", es: "Comparte este workflow con tu equipo" },
    templateDescription: {
      en: "People with access to the organization will be able to independently complete a copy of \"{{name}}\".",
      es: "Las personas con acceso a la organización podrán completar de forma independiente una copia de \"{{name}}\".",
    },
    executionDescription: {
      en: "People with access to the organization will be able to answer this same document: \"{{name}}\".",
      es: "Las personas con acceso a la organización podrán responder este mismo documento: \"{{name}}\".",
    },
    copy: { en: "Copy link", es: "Copiar link" },
    copied: { en: "Copied", es: "Copiado" },
    copyFailed: { en: "Couldn't copy the link", es: "No se pudo copiar el link" },
    openInNewTab: { en: "Open in new tab", es: "Abrir en pestaña nueva" },
    cardTooltip: { en: "Share this workflow", es: "Compartir este workflow" },
  },
  fill: {
    finishedTitle: { en: "Answers submitted", es: "Respuestas enviadas" },
    finishedDescription: {
      en: "Thanks for completing this form. You can close this tab now.",
      es: "Gracias por completar este formulario. Ya puedes cerrar esta pestaña.",
    },
    answerAnother: { en: "Answer another", es: "Responder otro" },
    readOnlyNotice: {
      en: "You don't have permission to answer this form — you can only view it.",
      es: "No tienes permiso para responder este formulario — solo puedes verlo.",
    },
    readOnlyStateNotice: {
      en: "This asset is {{state}}, fields can't be edited.",
      es: "Este activo está {{state}}, los campos no se pueden editar.",
    },
    readOnlyLifecycleNotice: {
      en: "Fields can't be edited at this lifecycle stage.",
      es: "Los campos no se pueden editar en esta etapa del ciclo de vida.",
    },
    readOnlySectionNotice: {
      en: "This section is read-only at this stage — you can view it but not answer it.",
      es: "Esta sección es de solo lectura en esta etapa — puedes verla pero no responderla.",
    },
    readOnlyInactiveSectionNotice: {
      en: "This section is inactive based on your answers — you can view it but not answer it.",
      es: "Esta sección está inactiva según tus respuestas — puedes verla pero no responderla.",
    },
    notFound: { en: "This link is invalid or incomplete", es: "Este link no es válido o está incompleto" },
    templateFallbackName: { en: "Workflow", es: "Workflow" },
    noCreatePermission: {
      en: "You don't have permission to create a document from this link.",
      es: "No tienes permiso para crear un documento desde este link.",
    },
    createError: {
      en: "Something went wrong creating this document.",
      es: "Ocurrió un error al crear este documento.",
    },
  },
}

export default translations
