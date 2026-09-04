const translations = {
  sheet: {
    title: { en: "Execute Version", es: "Ejecutar Versión" },
    description: {
      en: "Configure and execute this asset to generate content based on its sections.",
      es: "Configurar y ejecutar este activo para generar contenido basado en sus secciones.",
    },
  },
  button: {
    execute: { en: "Execute Version", es: "Ejecutar Versión" },
    addSections: { en: "Add Sections", es: "Agregar Secciones" },
  },
  executionScope: {
    label: { en: "Execution Scope", es: "Alcance de Ejecución" },
    placeholder: { en: "Select execution scope", es: "Seleccionar alcance de ejecución" },
    firstSectionOnly: { en: "Execute First Section Only", es: "Ejecutar Solo la Primera Sección" },
    entireDocument: { en: "Execute Entire Asset", es: "Ejecutar Activo Completo" },
    thisSectionOnly: { en: "Execute This Section Only", es: "Ejecutar Solo Esta Sección" },
    fromThisSection: { en: "Execute From This Section Onwards", es: "Ejecutar Desde Esta Sección en Adelante" },
    desc: {
      full: { en: "Generate content for all sections (new version)", es: "Genera contenido para todas las secciones (nueva versión)" },
      fullSingle: { en: "Generate content for the first section only (new version)", es: "Genera contenido solo para la primera sección (nueva versión)" },
      single: { en: "Generate content for this specific section (modifies existing)", es: "Genera contenido para esta sección específica (modifica la existente)" },
      from: { en: "Generate from this section to the end (modifies existing)", es: "Genera desde esta sección hasta el final (modifica la existente)" },
    },
  },
  selectedSection: {
    label: { en: "Selected Section", es: "Sección Seleccionada" },
    placeholder: { en: "Select a section", es: "Seleccionar una sección" },
    sectionNumber: { en: "Section #{{number}}", es: "Sección #{{number}}" },
    desc: {
      single: { en: "Only this section will be executed", es: "Solo se ejecutará esta sección" },
      from: { en: "All sections from this one onwards will be executed", es: "Se ejecutarán todas las secciones desde esta en adelante" },
    },
  },
  languageModel: {
    label: { en: "Language Model", es: "Modelo de Lenguaje" },
    placeholder: { en: "Select a language model", es: "Seleccionar un modelo de lenguaje" },
    defaultBadge: { en: "Default", es: "Predeterminado" },
    noModelDesc: {
      en: "Please select a language model to proceed with the execution.",
      es: "Seleccionar un modelo de lenguaje para continuar con la ejecución.",
    },
  },
  instructions: {
    label: { en: "Execution Instructions", es: "Instrucciones de Ejecución" },
    optional: { en: "(Optional)", es: "(Opcional)" },
    placeholder: {
      en: "Enter any specific instructions for this execution. For example: 'Focus on technical details' or 'Keep it concise and professional'...",
      es: "Ingresar instrucciones específicas para esta ejecución. Por ejemplo: 'Enfocar en detalles técnicos' o 'Mantener un tono conciso y profesional'...",
    },
    description: {
      en: "These instructions will guide the AI during content generation.",
      es: "Estas instrucciones guiarán a la IA durante la generación de contenido.",
    },
  },
  pending: {
    title: { en: "Executing Asset", es: "Ejecutando Activo" },
    description: {
      en: "Starting asset execution, this may take a few moments...",
      es: "Iniciando la ejecución del activo, esto puede tardar unos momentos...",
    },
  },
  error: {
    title: { en: "Failed to Execute a New Version", es: "Error al Ejecutar una Nueva Versión" },
    description: {
      en: "There was an error executing the asset. Please check your configuration and try again.",
      es: "Ocurrió un error al ejecutar el activo. Verificar la configuración y reintentar.",
    },
  },
  noSections: {
    title: { en: "No Sections Available", es: "Sin Secciones Disponibles" },
    description: {
      en: "This asset needs sections before it can be executed. Add some sections to get started with content generation.",
      es: "Este activo necesita secciones antes de poder ejecutarse. Agregar secciones para comenzar a generar contenido.",
    },
  },
  toast: {
    success: { en: "Asset execution started successfully", es: "Ejecución del activo iniciada exitosamente" },
    noDocumentId: { en: "Asset ID not available", es: "ID del activo no disponible" },
    noModel: { en: "Please select a language model", es: "Seleccionar un modelo de lenguaje" },
    noSection: { en: "Please select a section", es: "Seleccionar una sección" },
    noExecution: {
      en: "Please select an existing execution to modify",
      es: "Seleccionar una ejecución existente para modificar",
    },
    importSuccess: { en: "Asset imported successfully!", es: "¡Activo importado exitosamente!" },
    generationFailed: { en: "Asset generation failed. Please try again.", es: "La generación del activo falló. Reintentar." },
    missingDependency: {
      en: "Can't generate: a section this one depends on has no content yet. Generate or fill in that section first.",
      es: "No se puede generar: una sección de la que depende aún no tiene contenido. Generar o completar esa sección primero.",
    },
    importFailed: {
      en: "Asset import failed. Please try again.",
      es: "La importación del activo falló. Reintentar.",
    },
    pollingError: {
      en: "Error checking execution status. Please refresh the page.",
      es: "Error al verificar el estado de la ejecución. Actualizar la página.",
    },
  },
  banner: {
    status: {
      importing: { en: "importing", es: "importando" },
      importFailed: { en: "import failed", es: "importación fallida" },
      running: { en: "generating", es: "generando" },
      approving: { en: "approving", es: "aprobando" },
      pending: { en: "pending", es: "pendiente" },
      queued: { en: "queued", es: "en cola" },
      completed: { en: "completed", es: "completado" },
      failed: { en: "failed", es: "fallido" },
      cancelled: { en: "cancelled", es: "cancelado" },
      paused: { en: "paused", es: "pausado" },
    },
    description: {
      importing: {
        en: "Your asset is being imported and processed. This may take a moment.",
        es: "El activo está siendo importado y procesado. Esto puede tardar un momento.",
      },
      importFailed: {
        en: "There was an error importing your asset. Please try again.",
        es: "Hubo un error al importar el activo. Reintentar.",
      },
      running: {
        en: "Content is being generated. This may take a few minutes.",
        es: "El contenido se está generando. Esto puede tardar unos minutos.",
      },
      approving: {
        en: "Execution is being approved. Please wait...",
        es: "La ejecución está siendo aprobada. Esperar...",
      },
      pending: {
        en: "Waiting in queue to start generation...",
        es: "Esperando en cola para iniciar la generación...",
      },
      queued: {
        en: "Your execution is queued and will start soon.",
        es: "La ejecución está en cola y comenzará pronto.",
      },
      completed: {
        en: "Generation completed successfully!",
        es: "¡Generación completada exitosamente!",
      },
      failed: {
        en: "There was an error generating your asset. Please try again.",
        es: "Hubo un error al generar el activo. Reintentar.",
      },
      missingDependency: {
        en: "Generation stopped because one of the sections it depends on has no content yet. Generate or fill in that section and try again.",
        es: "La generación se detuvo porque una de las secciones de las que depende aún no tiene contenido. Generar o completar esa sección y reintentar.",
      },
      cancelled: {
        en: "Generation was cancelled.",
        es: "La generación fue cancelada.",
      },
      paused: {
        en: "Generation is paused.",
        es: "La generación está pausada.",
      },
      default: {
        en: "Processing your request...",
        es: "Procesando la solicitud...",
      },
    },
    documentPrefix: { en: "Asset is {{status}}", es: "El activo se está {{status}}" },
    documentError: { en: "Asset {{status}}", es: "Activo {{status}}" },
  },
  // Banner único de progreso de una corrida single/from (un solo banner por
  // corrida, no uno por sección — ver execution-run-progress-banner.tsx).
  executionRun: {
    title: {
      arming: { en: "Starting…", es: "Iniciando…" },
      running: { en: "Generating sections…", es: "Generando secciones…" },
      succeeded: { en: "Sections regenerated", es: "Secciones regeneradas" },
      failed: { en: "Section regeneration failed", es: "La regeneración de la sección falló" },
      cancelled: { en: "Section regeneration was cancelled", es: "La regeneración de la sección fue cancelada" },
    },
    progress: { en: "{{done}} of {{total}} sections", es: "{{done}} de {{total}} secciones" },
    currentSection: { en: "Working on “{{section}}”…", es: "Trabajando en «{{section}}»…" },
    description: {
      failed: { en: "There was an error regenerating the content. Please try again.", es: "Hubo un error al regenerar el contenido. Reintentar." },
      missingDependency: {
        en: "One of the sections in this run couldn't be generated because a dependency has no content yet. Generate or fill in that section and try again.",
        es: "Una de las secciones de esta corrida no se pudo generar porque una dependencia aún no tiene contenido. Generar o completar esa sección y reintentar.",
      },
    },
    refreshStatus: { en: "Refresh status", es: "Actualizar estado" },
    dismiss: { en: "Dismiss", es: "Descartar" },
    toast: {
      successSingle: { en: "Section regenerated successfully!", es: "¡Sección regenerada exitosamente!" },
      successMultiple: { en: "Sections regenerated successfully!", es: "¡Secciones regeneradas exitosamente!" },
      failed: { en: "Section regeneration failed", es: "La regeneración de la sección falló" },
      missingDependency: {
        en: "A section this one depends on has no content", es: "Falta contenido en una sección de la que esta depende",
      },
      cancelled: { en: "Section regeneration was cancelled", es: "La regeneración de la sección fue cancelada" },
    },
  },
  // Chip discreto junto al título de cada sección en scope de la corrida —
  // reemplaza el banner por sección de antes.
  sectionChip: {
    pending: { en: "queued", es: "en cola" },
    generating: { en: "generating", es: "generando" },
    failed: { en: "failed", es: "falló" },
  },
  otherVersionBanner: {
    versionTitle: { en: "Version \"{{name}}\" is {{status}}", es: "La versión \"{{name}}\" está {{status}}" },
    // Se muestra apenas se crea una versión nueva, antes de que /content
    // devuelva la ejecución con su nombre real (ver A4 en la guía de generación).
    newVersionFallback: { en: "New version", es: "Nueva versión" },
    viewVersion: { en: "View Version", es: "Ver Versión" },
    description: {
      running: { en: "Content is being generated for this version...", es: "Se está generando el contenido para esta versión..." },
      pending: { en: "Waiting in queue to start generation...", es: "Esperando en cola para iniciar la generación..." },
      completed: { en: "Generation completed successfully!", es: "¡Generación completada exitosamente!" },
      failed: { en: "Generation encountered an error.", es: "La generación encontró un error." },
      missingDependency: {
        en: "Generation stopped because one of the sections it depends on has no content yet. Generate or fill in that section and try again.",
        es: "La generación se detuvo porque una de las secciones de las que depende aún no tiene contenido. Generar o completar esa sección y reintentar.",
      },
      cancelled: { en: "Generation was cancelled.", es: "La generación fue cancelada." },
      paused: { en: "Generation is paused.", es: "La generación está pausada." },
    },
  },
  aiSuggestion: {
    status: {
      pending: { en: "AI suggestion pending...", es: "Sugerencia de IA pendiente..." },
      processing: { en: "AI is processing your request...", es: "La IA está procesando la solicitud..." },
      completed: { en: "AI suggestion ready", es: "Sugerencia de IA lista" },
      failed: { en: "AI suggestion failed", es: "La sugerencia de IA falló" },
    },
    description: {
      pending: { en: "Your request is queued and will be processed shortly.", es: "La solicitud está en cola y será procesada en breve." },
      processing: { en: "The AI is working on your edit. This may take a few seconds.", es: "La IA está trabajando en la edición. Esto puede tardar unos segundos." },
      completed: { en: "The suggestion has been applied as a preview. Review and save to keep it.", es: "La sugerencia se aplicó como vista previa. Revisar y guardar para conservarla." },
      failed: { en: "Something went wrong generating the suggestion. Please try again.", es: "Algo salió mal al generar la sugerencia. Reintentar." },
    },
    completed: {
      readyToReview: { en: "Click to compare and apply the suggested changes.", es: "Hacer clic para comparar y aplicar los cambios sugeridos." },
      viewSuggestion: { en: "View Suggestion", es: "Ver sugerencia" },
    },
    refresh: { en: "Refresh status", es: "Actualizar estado" },
    dismiss: { en: "Dismiss", es: "Descartar" },
    toast: {
      success: { en: "AI suggestion ready!", es: "¡Sugerencia de IA lista!" },
      failed: { en: "AI suggestion failed", es: "La sugerencia de IA falló" },
    },
  },
}

export default translations
