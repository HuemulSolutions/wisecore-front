const translations = {
  sheet: {
    title: { en: "Execute Version", es: "Ejecutar Versión" },
    description: {
      en: "Configure and execute this document to generate content based on its sections.",
      es: "Configura y ejecuta este documento para generar contenido basado en sus secciones.",
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
    entireDocument: { en: "Execute Entire Document", es: "Ejecutar Documento Completo" },
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
    title: { en: "Executing Document", es: "Ejecutando Documento" },
    description: {
      en: "Starting document execution, this may take a few moments...",
      es: "Iniciando la ejecución del documento, esto puede tardar unos momentos...",
    },
  },
  error: {
    title: { en: "Failed to Execute a New Version", es: "Error al Ejecutar una Nueva Versión" },
    description: {
      en: "There was an error executing the document. Please check your configuration and try again.",
      es: "Ocurrió un error al ejecutar el documento. Por favor verifica tu configuración e inténtalo de nuevo.",
    },
  },
  noSections: {
    title: { en: "No Sections Available", es: "Sin Secciones Disponibles" },
    description: {
      en: "This document needs sections before it can be executed. Add some sections to get started with content generation.",
      es: "Este documento necesita secciones antes de poder ejecutarse. Agrega secciones para comenzar a generar contenido.",
    },
  },
  toast: {
    success: { en: "Document execution started successfully", es: "Ejecución del documento iniciada exitosamente" },
    noDocumentId: { en: "Document ID not available", es: "ID del documento no disponible" },
    noModel: { en: "Please select a language model", es: "Por favor selecciona un modelo de lenguaje" },
    noSection: { en: "Please select a section", es: "Por favor selecciona una sección" },
    noExecution: {
      en: "Please select an existing execution to modify",
      es: "Por favor selecciona una ejecución existente para modificar",
    },
  },
}

export default translations
