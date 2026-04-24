const translations = {
  sectionTitle: { en: "Functionalities", es: "Funcionalidades" },
  addFunctionality: { en: "Add Functionality", es: "Agregar Funcionalidad" },
  empty: { en: "No functionalities yet", es: "No hay funcionalidades aún" },
  emptyDescription: {
    en: "Add the first functionality to this system.",
    es: "Agrega la primera funcionalidad a este sistema.",
  },
  detail: {
    placeholder: {
      en: "Select a functionality to view its details",
      es: "Selecciona una funcionalidad para ver sus detalles",
    },
    name: { en: "Name", es: "Nombre" },
    description: { en: "Description", es: "Descripción" },
    partialUrl: { en: "Partial URL", es: "URL Parcial" },
    storageUrl: { en: "Storage URL", es: "URL de Almacenamiento" },
    httpMethod: { en: "HTTP Method", es: "Método HTTP" },
    objective: { en: "Objective", es: "Objetivo" },
    executionType: { en: "Execution Type", es: "Tipo de Ejecución" },
    functionalityClass: { en: "Class", es: "Clase" },
    usageExample: { en: "Usage Example", es: "Ejemplo de Uso" },
    body: { en: "Body", es: "Cuerpo" },
    createdAt: { en: "Created At", es: "Creado el" },
    updatedAt: { en: "Updated At", es: "Actualizado el" },
    noDescription: { en: "No description", es: "Sin descripción" },
    tabs: {
      docs: { en: "Docs", es: "Docs" },
      params: { en: "Params", es: "Parámetros" },
      secrets: { en: "Secrets", es: "Secretos" },
      body: { en: "Body", es: "Cuerpo" },
      logs: { en: "Logs", es: "Registros" },
    },
    response: {
      label: { en: "Response", es: "Respuesta" },
      empty: { en: "No response yet", es: "Sin respuesta aún" },
      hint: {
        en: "Responses will appear here once the endpoint is called",
        es: "Las respuestas aparecerán aquí cuando se llame al endpoint",
      },
    },
  },
  form: {
    namePlaceholder: { en: "e.g. Get Users", es: "ej. Obtener Usuarios" },
    descriptionPlaceholder: {
      en: "Describe what this functionality does...",
      es: "Describe qué hace esta funcionalidad...",
    },
    partialUrlPlaceholder: { en: "/endpoint-path", es: "/ruta-endpoint" },
    storageUrlPlaceholder: { en: "Storage URL (optional)", es: "URL de almacenamiento (opcional)" },
    usageExamplePlaceholder: { en: "Usage example...", es: "Ejemplo de uso..." },
    bodyPlaceholder: { en: '{"key": "value"}', es: '{"clave": "valor"}' },
    httpMethodPlaceholder: { en: "Select method", es: "Seleccionar método" },
    objectivePlaceholder: { en: "Select objective", es: "Seleccionar objetivo" },
    executionTypePlaceholder: { en: "Select execution type", es: "Seleccionar tipo de ejecución" },
    functionalityClassPlaceholder: { en: "Select class", es: "Seleccionar clase" },
  },
  create: {
    title: { en: "Add Functionality", es: "Agregar Funcionalidad" },
    submitLabel: { en: "Add Functionality", es: "Agregar Funcionalidad" },
  },
  edit: {
    title: { en: "Edit Functionality", es: "Editar Funcionalidad" },
  },
  delete: {
    title: { en: "Delete Functionality", es: "Eliminar Funcionalidad" },
    description: {
      en: "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar \"{{name}}\"? Esta acción no se puede deshacer.",
    },
  },
  objective: {
    import_asset: { en: "Import Asset", es: "Importar Activo" },
    export_asset: { en: "Export Asset", es: "Exportar Activo" },
    edit_section: { en: "Edit Section", es: "Editar Sección" },
    review_section: { en: "Review Section", es: "Revisar Sección" },
    publish_asset: { en: "Publish Asset", es: "Publicar Activo" },
  },
  executionType: {
    sync: { en: "Synchronous", es: "Síncrono" },
    async: { en: "Asynchronous", es: "Asíncrono" },
  },
  class: {
    agent: { en: "Agent", es: "Agente" },
    endpoint: { en: "Endpoint", es: "Endpoint" },
  },
  actions: {
    edit: { en: "Edit Functionality", es: "Editar Funcionalidad" },
    delete: { en: "Delete Functionality", es: "Eliminar Funcionalidad" },
  },
}

export default translations
