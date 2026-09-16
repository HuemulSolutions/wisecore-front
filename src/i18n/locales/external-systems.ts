const translations = {
  header: {
    title: { en: "Extensions", es: "Extensiones" },
    addSystem: { en: "Add Extension", es: "Agregar Extensión" },
    searchPlaceholder: { en: "Search extensions...", es: "Buscar extensiones..." },
    systemsCount: { en: "{{count}} extensions", es: "{{count}} extensiones" },
    closeSearch: { en: "Close search", es: "Cerrar búsqueda" },
    newSystem: { en: "New extension", es: "Nueva extensión" },
  },
  columns: {
    baseUrl: { en: "Base URL", es: "URL Base" },
  },
  list: {
    empty: { en: "No extensions found", es: "No se encontraron extensiones" },
    emptyDescription: {
      en: "Get started by adding your first extension.",
      es: "Agregar la primera extensión para comenzar.",
    },
    emptySearchDescription: {
      en: "No extensions match your search. Try a different term.",
      es: "Ninguna extensión coincide con la búsqueda. Probar otro término.",
    },
    loading: { en: "Loading extensions...", es: "Cargando extensiones..." },
  },
  detail: {
    placeholder: {
      en: "Select an extension to view its details",
      es: "Seleccionar una extensión para ver sus detalles",
    },
    baseUrl: { en: "Base URL", es: "URL Base" },
    createdAt: { en: "Created At", es: "Creado el" },
    updatedAt: { en: "Updated At", es: "Actualizado el" },
    createdBy: { en: "Created By", es: "Creado por" },
  },
  form: {
    namePlaceholder: { en: "e.g. Wordpress API", es: "ej. Wordpress API" },
    baseUrlPlaceholder: { en: "https://example.com/", es: "https://ejemplo.com/" },
    statusPlaceholder: { en: "Select status", es: "Seleccionar estado" },
  },
  emptyState: {
    empty: { en: "No extensions yet", es: "No hay extensiones aún" },
    noResults: { en: "No extensions match your search", es: "Ninguna extensión coincide con la búsqueda" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load extensions", es: "Error al cargar las extensiones" },
    errorDescription: { en: "An error occurred while loading extensions. Please try again.", es: "Ocurrió un error al cargar las extensiones. Reintentar." },
  },
  accessDenied: {
    description: {
      en: "You don't have permission to access Extensions.",
      es: "No hay permiso para acceder a las Extensiones.",
    },
  },
  actions: {
    edit: { en: "Edit Extension", es: "Editar Extensión" },
    delete: { en: "Delete Extension", es: "Eliminar Extensión" },
    connect: { en: "Connect", es: "Conectar" },
    disconnect: { en: "Disconnect", es: "Desconectar" },
  },
  status: {
    connected: { en: "Connected", es: "Conectado" },
    disconnected: { en: "Disconnected", es: "Desconectado" },
    error: { en: "Error", es: "Error" },
  },
  create: {
    title: { en: "Add Extension", es: "Agregar Extensión" },
    description: {
      en: "Enter the details to connect a new extension.",
      es: "Ingresar los detalles para conectar una nueva extensión.",
    },
    submitLabel: { en: "Add Extension", es: "Agregar Extensión" },
    success: { en: "Extension added successfully", es: "Extensión agregada correctamente" },
    errorFailed: { en: "Failed to add extension", es: "Error al agregar la extensión" },
  },
  edit: {
    title: { en: "Edit Extension", es: "Editar Extensión" },
    description: {
      en: "Update the extension details.",
      es: "Actualizar los detalles de la extensión.",
    },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: { en: "Extension updated successfully", es: "Extensión actualizada correctamente" },
    errorFailed: { en: "Failed to update extension", es: "Error al actualizar la extensión" },
  },
  delete: {
    title: { en: "Delete Extension", es: "Eliminar Extensión" },
    description: {
      en: "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
      es: "¿Eliminar \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    success: { en: "Extension deleted successfully", es: "Extensión eliminada correctamente" },
    errorFailed: { en: "Failed to delete extension", es: "Error al eliminar la extensión" },
  },
}

export default translations
