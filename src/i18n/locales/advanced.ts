const translations = {
  title: { en: "Advanced", es: "Avanzado" },
  menu: {
    home: { en: "Home", es: "Inicio" },
    massExecution: { en: "Mass Execution", es: "Ejecución masiva" },
    excelExport: { en: "Mass Export", es: "Exportación masiva" },
    wordExport: { en: "Word Export", es: "Exportación Word" },
    changeHistory: { en: "Pending Changes", es: "Cambios pendientes" },
  },
  home: {
    title: { en: "Advanced Tools", es: "Herramientas avanzadas" },
    description: {
      en: "This section gives you access to powerful tools for managing and processing your organization's assets at scale.",
      es: "Esta sección te da acceso a herramientas potentes para gestionar y procesar los activos de tu organización a gran escala.",
    },
    availableOptions: { en: "Available options", es: "Opciones disponibles" },
    massExecution: {
      title: { en: "Mass Execution", es: "Ejecución masiva" },
      description: {
        en: "Run AI-powered executions or edits across multiple assets at once. Select a template, configure the section and edit type, and apply changes in bulk.",
        es: "Ejecuta acciones de IA o ediciones sobre múltiples activos a la vez. Selecciona un template, configura la sección y el tipo de edición, y aplica los cambios en masa.",
      },
    },
    changeHistory: {
      title: { en: "Pending Changes", es: "Cambios pendientes" },
      description: {
        en: "Review pending changes across your assets, including AI-generated content and manual edits awaiting approval.",
        es: "Revisa los cambios pendientes en tus activos, incluyendo contenido generado por IA y ediciones manuales que esperan aprobación.",
      },
    },
    excelExport: {
      title: { en: "Excel Export", es: "Exportación Excel" },
      description: {
        en: "Export data from multiple assets to Excel at once. Select a template, choose the sections to include, and download the result.",
        es: "Exporta datos de múltiples activos a Excel a la vez. Selecciona un template, elige las secciones a incluir y descarga el resultado.",
      },
    },
    wordExport: {
      title: { en: "Word Export", es: "Exportación Word" },
      description: {
        en: "Export multiple assets as Word documents in a ZIP file. Optionally upload a DOCX template to customize the output.",
        es: "Exporta múltiples activos como documentos Word en un archivo ZIP. Opcionalmente sube un template DOCX para personalizar el resultado.",
      },
    },
  },
  massExecution: {
    steps: {
      template: { en: "Template", es: "Template" },
      section: { en: "Section to modify", es: "Sección a modificar" },
      editType: { en: "Edit type", es: "Tipo de edición" },
      executionMode: { en: "Execution mode", es: "Modo de ejecución" },
    },
    selectTemplate: { en: "Select a template...", es: "Seleccionar un template..." },
    loadingTemplates: { en: "Loading templates...", es: "Cargando templates..." },
    selectSection: { en: "Select a section...", es: "Seleccionar una sección..." },
    loadingSections: { en: "Loading sections...", es: "Cargando secciones..." },
    editTypes: {
      executeAi: {
        title: { en: "Execute with AI", es: "Ejecutar con IA" },
        description: { en: "Generates content automatically", es: "Genera contenido automáticamente" },
      },
      editAi: {
        title: { en: "Edit with AI", es: "Editar con IA" },
        description: { en: "Edits existing content automatically", es: "Edita el contenido existente automáticamente" },
      },
      manual: {
        title: { en: "Manual edit", es: "Editar manual" },
        description: { en: "Edit content manually", es: "Edita el contenido de forma manual" },
      },
    },
    llmModel: { en: "Language model", es: "Modelo de lenguaje" },
    selectModel: { en: "Select a model...", es: "Seleccionar un modelo..." },
    loadingModels: { en: "Loading models...", es: "Cargando modelos..." },
    default: { en: "Default", es: "Predeterminado" },
    instructions: { en: "AI instructions (optional)", es: "Instrucciones para la IA (opcional)" },
    instructionsRequired: { en: "AI instructions", es: "Instrucciones para la IA" },
    instructionsPlaceholder: {
      en: "Enter specific instructions for this execution...",
      es: "Ingresa instrucciones específicas para esta ejecución...",
    },
    executeSuccess: { en: "Mass execution started successfully", es: "Ejecución masiva iniciada exitosamente" },
    executeError: { en: "Failed to start mass execution", es: "Error al iniciar la ejecución masiva" },
    result: {
      title: { en: "Execution result", es: "Resultado de la ejecución" },
      total: { en: "{{count}} executions were processed", es: "Se procesaron {{count}} ejecuciones" },
      enqueued: { en: "Enqueued", es: "Encolados" },
      enqueuedDescription: { en: "Job was queued successfully and will be processed shortly", es: "El job fue encolado correctamente y se procesará en breve" },
      skipped: { en: "Skipped", es: "Omitidos" },
      skippedDescription: { en: "Not processed due to an expected condition (e.g. no content to process)", es: "No se procesaron por una condición esperada (ej. sin contenido que procesar)" },
      failed: { en: "Failed", es: "Fallidos" },
      failedDescription: { en: "A real error occurred while processing these executions", es: "Ocurrió un error real al procesar estas ejecuciones" },
      close: { en: "Close", es: "Cerrar" },
    },
    executionModes: {
      single: {
        title: { en: "Execute this section only", es: "Ejecutar solo esta sección" },
        description: {
          en: "Executes only the selected section",
          es: "Ejecuta únicamente la sección seleccionada",
        },
      },
      from: {
        title: { en: "Execute from this section onwards", es: "Ejecutar desde esta sección en adelante" },
        description: {
          en: "Executes from the selected section to the end",
          es: "Ejecuta desde la sección seleccionada hasta el final",
        },
      },
      review: {
        title: { en: "Execute and review", es: "Ejecutar y revisar" },
        description: {
          en: "Section is left pending review in the document",
          es: "Sección queda pendiente de revisión en el documento",
        },
      },
      save: {
        title: { en: "Execute and save", es: "Ejecutar y guardar" },
        description: {
          en: "Queued for processing and saved automatically",
          es: "Se procesa en cola y queda automáticamente guardado",
        },
      },
    },
  },
  assetSelection: {
    title: { en: "Select assets", es: "Seleccionar activos" },
    selected: { en: "selected", es: "seleccionados" },
    selectAll: { en: "Select all", es: "Seleccionar todos" },
    available: { en: "assets available", es: "activos disponibles" },
    loading: { en: "Loading assets...", es: "Cargando activos..." },
    noAssets: { en: "No assets found for this template", es: "No se encontraron activos para este template" },
    selectTemplateFirst: { en: "Select a template to see available assets", es: "Selecciona un template para ver los activos disponibles" },
    versions: { en: "versions", es: "versiones" },
    hideVersions: { en: "- hide", es: "- ocultar" },
    uncategorized: { en: "Uncategorized", es: "Sin carpeta" },
    execute: { en: "Execute", es: "Ejecutar" },
    executing: { en: "Executing...", es: "Ejecutando..." },
    export: { en: "Export", es: "Exportar" },
    exporting: { en: "Exporting...", es: "Exportando..." },
    openAsset: { en: "Open asset", es: "Abrir activo" },
    openVersion: { en: "Open version", es: "Abrir versión" },
  },
  changeHistory: {
    title: { en: "Change History", es: "Historial de cambios" },
    subtitle: {
      en: "Select a document to view its changes",
      es: "Selecciona un documento para ver sus cambios",
    },
    searchPlaceholder: { en: "Search document...", es: "Buscar documento..." },
    filterPending: {
      en: "View unapproved changes",
      es: "Ver cambios sin aprobar",
    },
    sectionTitle: {
      en: "Documents with pending changes",
      es: "Documentos con cambios pendientes",
    },
    lastModified: {
      en: "Last modified: {{date}}",
      es: "Última modificación: {{date}}",
    },
    pendingCount_one: { en: "{{count}} pending", es: "{{count}} pendiente" },
    pendingCount_other: { en: "{{count}} pending", es: "{{count}} pendientes" },
    pendingCount: { en: "{{count}} pending", es: "{{count}} pendientes" },
    suggestionCount: {
      en: "{{count}} pending",
      es: "{{count}} pendientes",
    },
    loading: { en: "Loading...", es: "Cargando..." },
    empty: {
      en: "No documents with pending changes",
      es: "No hay documentos con cambios pendientes",
    },
    noResults: {
      en: "No documents match your search",
      es: "No se encontraron documentos con tu búsqueda",
    },
    page: { en: "Page {{page}}", es: "Página {{page}}" },
    previous: { en: "Previous", es: "Anterior" },
    next: { en: "Next", es: "Siguiente" },
    openAsset: { en: "Open document", es: "Abrir documento" },
    openVersion: {
      en: "Open this version in a new tab",
      es: "Abrir esta versión en una nueva pestaña",
    },
    openSection: {
      en: "Go to this section",
      es: "Ir a esta sección",
    },
    refresh: { en: "Refresh", es: "Actualizar" },
  },
  excelExport: {
    steps: {
      exportType: { en: "Export format", es: "Formato de exportación" },
      sections: { en: "Sections to export", es: "Secciones a exportar" },
    },
    noSections: { en: "No sections available", es: "No hay secciones disponibles" },
    selectSections: { en: "Select sections...", es: "Seleccionar secciones..." },
    sectionsSelected: { en: "{{count}} sections selected", es: "{{count}} secciones seleccionadas" },
    searchSections: { en: "Search sections...", es: "Buscar secciones..." },
    noResults: { en: "No sections found", es: "No se encontraron secciones" },
    exportSuccess: { en: "Excel export started successfully", es: "Exportación a Excel iniciada exitosamente" },
    exportError: { en: "Failed to export to Excel", es: "Error al exportar a Excel" },
  },
  wordExport: {
    steps: {
      docxTemplate: { en: "Word template", es: "Template Word" },
    },
    sourceAsset: { en: "Asset template", es: "Template del activo" },
    sourceAssetDescription: { en: "Each asset uses its own DOCX template.", es: "Cada activo usa su propia plantilla DOCX." },
    sourceTemplate: { en: "Template's DOCX", es: "DOCX de la plantilla" },
    sourceTemplateDescription: { en: "Use a DOCX template from the selected template.", es: "Usa una plantilla DOCX de la plantilla seleccionada." },
    selectTemplateFirst: { en: "Select a template first to see its DOCX templates.", es: "Selecciona un template primero para ver sus plantillas DOCX." },
    loadingDocxTemplates: { en: "Loading DOCX templates...", es: "Cargando plantillas DOCX..." },
    noDocxTemplates: { en: "No DOCX templates found for this template.", es: "No se encontraron plantillas DOCX para este template." },
    selectDocxTemplate: { en: "Select a DOCX template...", es: "Seleccionar una plantilla DOCX..." },
    searchDocxTemplates: { en: "Search templates...", es: "Buscar plantillas..." },
    noDocxResults: { en: "No templates match your search", es: "No hay plantillas que coincidan con tu búsqueda" },
    orUploadFile: { en: "or upload a file", es: "o sube un archivo" },
    uploadDocxTemplate: { en: "Upload .docx template", es: "Subir template .docx" },
    exportSuccess: { en: "Word export started successfully", es: "Exportación Word iniciada exitosamente" },
    exportError: { en: "Failed to export to Word", es: "Error al exportar a Word" },
  },
}

export default translations
