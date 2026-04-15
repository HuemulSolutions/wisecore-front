const translations = {
  title: { en: "Advanced", es: "Avanzado" },
  menu: {
    massExecution: { en: "Mass Execution", es: "Ejecución masiva" },
    changeHistory: { en: "Change History", es: "Historial de cambios" },
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
    instructionsPlaceholder: {
      en: "Enter specific instructions for this execution...",
      es: "Ingresa instrucciones específicas para esta ejecución...",
    },
    executeSuccess: { en: "Mass execution started successfully", es: "Ejecución masiva iniciada exitosamente" },
    executeError: { en: "Failed to start mass execution", es: "Error al iniciar la ejecución masiva" },
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
  },
}

export default translations
