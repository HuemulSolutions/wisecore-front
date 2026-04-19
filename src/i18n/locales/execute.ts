const translations = {
  sheet: {
    title: { en: "Execute Version", es: "Ejecutar Versión" },
    description: {
      en: "Configure and execute this asset to generate content based on its sections.",
      es: "Configura y ejecuta este activo para generar contenido basado en sus secciones.",
    },
  },
  button: {
    execute: { en: "Execute Version", es: "Ejecutar Versión" },
    creating: { en: "Creating...", es: "Creando..." },
    loading: { en: "Loading...", es: "Cargando..." },
    tryAgain: { en: "Try Again", es: "Reintentar" },
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
      es: "Por favor selecciona un modelo de lenguaje para continuar con la ejecución.",
    },
  },
  instructions: {
    label: { en: "Execution Instructions", es: "Instrucciones de Ejecución" },
    optional: { en: "(Optional)", es: "(Opcional)" },
    placeholder: {
      en: "Enter any specific instructions for this execution. For example: 'Focus on technical details' or 'Keep it concise and professional'...",
      es: "Ingresa instrucciones específicas para esta ejecución. Por ejemplo: 'Enfócate en detalles técnicos' o 'Mantén un tono conciso y profesional'...",
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
      es: "Ocurrió un error al ejecutar el activo. Por favor verifica tu configuración e inténtalo de nuevo.",
    },
  },
  noSections: {
    title: { en: "No Sections Available", es: "Sin Secciones Disponibles" },
    description: {
      en: "This asset needs sections before it can be executed. Add some sections to get started with content generation.",
      es: "Este activo necesita secciones antes de poder ejecutarse. Agrega secciones para comenzar a generar contenido.",
    },
  },
  toast: {
    success: { en: "Asset execution started successfully", es: "Ejecución del activo iniciada exitosamente" },
    noDocumentId: { en: "Asset ID not available", es: "ID del activo no disponible" },
    noModel: { en: "Please select a language model", es: "Por favor selecciona un modelo de lenguaje" },
    noSection: { en: "Please select a section", es: "Por favor selecciona una sección" },
    noExecution: {
      en: "Please select an existing execution to modify",
      es: "Por favor selecciona una ejecución existente para modificar",
    },
    importSuccess: { en: "Asset imported successfully!", es: "¡Activo importado exitosamente!" },
    generationFailed: { en: "Asset generation failed. Please try again.", es: "La generación del activo falló. Por favor inténtalo de nuevo." },
    importFailed: {
      en: "Asset import failed. Please try again.",
      es: "La importación del activo falló. Por favor inténtalo de nuevo.",
    },
    pollingError: {
      en: "Error checking execution status. Please refresh the page.",
      es: "Error al verificar el estado de la ejecución. Por favor actualiza la página.",
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
        es: "Tu activo está siendo importado y procesado. Esto puede tardar un momento.",
      },
      importFailed: {
        en: "There was an error importing your asset. Please try again.",
        es: "Hubo un error al importar tu activo. Por favor inténtalo de nuevo.",
      },
      running: {
        en: "Content is being generated. This may take a few minutes.",
        es: "El contenido se está generando. Esto puede tardar unos minutos.",
      },
      approving: {
        en: "Execution is being approved. Please wait...",
        es: "La ejecución está siendo aprobada. Por favor espera...",
      },
      pending: {
        en: "Waiting in queue to start generation...",
        es: "Esperando en cola para iniciar la generación...",
      },
      queued: {
        en: "Your execution is queued and will start soon.",
        es: "Tu ejecución está en cola y comenzará pronto.",
      },
      completed: {
        en: "Generation completed successfully!",
        es: "¡Generación completada exitosamente!",
      },
      failed: {
        en: "There was an error generating your asset. Please try again.",
        es: "Hubo un error al generar tu activo. Por favor inténtalo de nuevo.",
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
        es: "Procesando tu solicitud...",
      },
    },
    documentPrefix: { en: "Asset is {{status}}", es: "El activo está {{status}}" },
    documentError: { en: "Asset {{status}}", es: "Activo {{status}}" },
  },
  sectionFeedback: {
    status: {
      pending: { en: "pending", es: "pendiente" },
      generating: { en: "generating", es: "generando" },
      completed: { en: "completed", es: "completado" },
      processing: { en: "processing", es: "procesando" },
    },
    description: {
      pendingSingle: { en: "This section is queued for regeneration", es: "Esta sección está en cola para regeneración" },
      pendingFrom: { en: "Waiting for previous sections to complete", es: "Esperando a que las secciones anteriores se completen" },
      generatingSingle: { en: "AI is regenerating this section...", es: "La IA está regenerando esta sección..." },
      generatingFrom: { en: "AI is working on this section...", es: "La IA está trabajando en esta sección..." },
      doneSingle: { en: "This section has been successfully regenerated. Click dismiss to remove this message.", es: "Esta sección se ha regenerado exitosamente. Haz clic en descartar para quitar este mensaje." },
      doneFrom: { en: "This section has been regenerated. Click dismiss to remove this message.", es: "Esta sección se ha regenerado. Haz clic en descartar para quitar este mensaje." },
      default: { en: "Section is being processed", es: "La sección se está procesando" },
    },
    sectionIs: { en: "Section is {{status}}", es: "La sección está {{status}}" },
    refreshStatus: { en: "Refresh status", es: "Actualizar estado" },
    dismiss: { en: "Dismiss", es: "Descartar" },
    toast: {
      successSingle: { en: "Section regenerated successfully!", es: "¡Sección regenerada exitosamente!" },
      successMultiple: { en: "Sections regenerated successfully!", es: "¡Secciones regeneradas exitosamente!" },
      failed: { en: "Section regeneration failed", es: "La regeneración de la sección falló" },
      cancelled: { en: "Section regeneration was cancelled", es: "La regeneración de la sección fue cancelada" },
    },
  },
  sectionRegeneration: {
    regeneratingSingle: { en: "Regenerating section {{current}}{{ofTotal}}...", es: "Regenerando sección {{current}}{{ofTotal}}..." },
    regeneratingFrom: { en: "Regenerating from section {{current}}{{ofTotal}}...", es: "Regenerando desde la sección {{current}}{{ofTotal}}..." },
    ofTotal: { en: " of {{total}}", es: " de {{total}}" },
    starting: { en: "Starting...", es: "Iniciando..." },
    processing: { en: "Processing...", es: "Procesando..." },
    refresh: { en: "Refresh", es: "Actualizar" },
  },
  aiSuggestion: {
    status: {
      pending: { en: "AI suggestion pending...", es: "Sugerencia de IA pendiente..." },
      processing: { en: "AI is processing your request...", es: "La IA está procesando tu solicitud..." },
      completed: { en: "AI suggestion ready", es: "Sugerencia de IA lista" },
      failed: { en: "AI suggestion failed", es: "La sugerencia de IA falló" },
    },
    description: {
      pending: { en: "Your request is queued and will be processed shortly.", es: "Tu solicitud está en cola y será procesada en breve." },
      processing: { en: "The AI is working on your edit. This may take a few seconds.", es: "La IA está trabajando en tu edición. Esto puede tardar unos segundos." },
      completed: { en: "The suggestion has been applied as a preview. Review and save to keep it.", es: "La sugerencia se aplicó como vista previa. Revisa y guarda para conservarla." },
      failed: { en: "Something went wrong generating the suggestion. Please try again.", es: "Algo salió mal al generar la sugerencia. Intenta de nuevo." },
    },
    completed: {
      readyToReview: { en: "Click to compare and apply the suggested changes.", es: "Haz clic para comparar y aplicar los cambios sugeridos." },
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
