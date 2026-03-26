const translations = {
  // context-add.tsx
  loading: { en: "Loading contexts...", es: "Cargando contextos..." },
  errorLoading: { en: "Error loading contexts", es: "Error al cargar los contextos" },
  currentContexts: { en: "Current Contexts", es: "Contextos Actuales" },
  contextsCount: { en: "{{count}} contexts", es: "{{count}} contextos" },
  addContext: { en: "Add Context", es: "Agregar Contexto" },
  noContexts: { en: "No contexts configured", es: "Sin contextos configurados" },
  noContextsDescription: {
    en: "Add context to provide additional information and variables for asset execution.",
    es: "Agrega contexto para proporcionar información adicional y variables para la ejecución del activo.",
  },
  noContentAvailable: { en: "No content available", es: "Sin contenido disponible" },
  badgeText: { en: "Text", es: "Texto" },
  badgeDocument: { en: "Asset", es: "Activo" },
  editContextTitle: { en: "Edit Context", es: "Editar Contexto" },
  deleteContextTitle: { en: "Delete Context", es: "Eliminar Contexto" },
  toast: {
    contextDeleted: { en: "Context deleted successfully", es: "Contexto eliminado exitosamente" },
    contextUpdated: { en: "Context updated successfully", es: "Contexto actualizado exitosamente" },
  },
  // context-add-dialog.tsx
  addDialog: {
    title: { en: "Add New Context", es: "Agregar Nuevo Contexto" },
    description: {
      en: "Add text or asset context to provide additional information for asset execution.",
      es: "Agrega contexto de texto o activo para proporcionar información adicional para la ejecución del activo.",
    },
    tabText: { en: "Text Context", es: "Contexto de Texto" },
    tabDocument: { en: "Asset Context", es: "Contexto de Activo" },
    addTextButton: { en: "Add Text Context", es: "Agregar Contexto de Texto" },
    addDocumentButton: { en: "Add Asset Context", es: "Agregar Contexto de Activo" },
    contextName: { en: "Context Name", es: "Nombre del Contexto" },
    contextNamePlaceholder: { en: "Enter context name", es: "Ingresa el nombre del contexto" },
    contextContent: { en: "Context Content", es: "Contenido del Contexto" },
    contextContentPlaceholder: { en: "Enter context content", es: "Ingresa el contenido del contexto" },
    selectDocument: { en: "Select Asset", es: "Seleccionar Activo" },
    toastTextAdded: { en: "Text context added successfully", es: "Contexto de texto agregado exitosamente" },
    toastDocumentAdded: { en: "Asset context added successfully", es: "Contexto de activo agregado exitosamente" },
    validationFillFields: { en: "Please fill in all fields", es: "Por favor completa todos los campos" },
    validationSelectFile: { en: "Please select a file", es: "Por favor selecciona un archivo" },
  },
  // context-edit-dialog.tsx
  editDialog: {
    title: { en: "Edit Context", es: "Editar Contexto" },
    description: {
      en: "Update the name and content of this context.",
      es: "Actualiza el nombre y el contenido de este contexto.",
    },
    saveChanges: { en: "Save Changes", es: "Guardar Cambios" },
    contextName: { en: "Context Name", es: "Nombre del Contexto" },
    contextNamePlaceholder: { en: "Enter context name", es: "Ingresa el nombre del contexto" },
    contextContent: { en: "Context Content", es: "Contenido del Contexto" },
    contextContentPlaceholder: { en: "Enter context content", es: "Ingresa el contenido del contexto" },
  },
  // context-delete-dialog.tsx
  deleteDialog: {
    title: { en: "Delete Context", es: "Eliminar Contexto" },
    description: {
      en: "Are you sure you want to delete this context? This action cannot be undone and may affect asset execution.",
      es: "¿Estás seguro de que deseas eliminar este contexto? Esta acción no se puede deshacer y puede afectar la ejecución del activo.",
    },
    deleteButton: { en: "Delete", es: "Eliminar" },
  },
  // context-content.tsx
  content: {
    collapse: { en: "Collapse", es: "Colapsar" },
    expand: { en: "Expand", es: "Expandir" },
  },
  // assets-context-sheet.tsx
  sheet: {
    manageContext: { en: "Manage Context", es: "Gestionar Contexto" },
    buttonLabel: { en: "Context", es: "Contexto" },
    title: { en: "Asset Context", es: "Contexto del Activo" },
    description: {
      en: "Configure asset context, variables, and execution environment.",
      es: "Configura el contexto del activo, variables y entorno de ejecución.",
    },
    documentLabel: { en: "Asset: {{name}}", es: "Activo: {{name}}" },
    documentDescription: {
      en: "Set up context variables, user permissions, and environmental settings that influence asset execution and content generation.",
      es: "Configura variables de contexto, permisos de usuario y ajustes del entorno que influyen en la ejecución y generación de contenido del activo.",
    },
  },
}

export default translations
