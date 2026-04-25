const translations = {
  header: {
    title: { en: "External Systems", es: "Sistemas Externos" },
    addSystem: { en: "Add System", es: "Agregar Sistema" },
    searchPlaceholder: { en: "Search systems...", es: "Buscar sistemas..." },
    systemsCount: { en: "{{count}} systems", es: "{{count}} sistemas" },
    refresh: { en: "Refresh", es: "Actualizar" },
    search: { en: "Search", es: "Buscar" },
    closeSearch: { en: "Close search", es: "Cerrar búsqueda" },
    newSystem: { en: "New external system", es: "Nuevo sistema externo" },
  },
  columns: {
    name: { en: "Name", es: "Nombre" },
    baseUrl: { en: "Base URL", es: "URL Base" },
    status: { en: "Status", es: "Estado" },
    updatedAt: { en: "Updated", es: "Actualizado" },
  },
  list: {
    empty: { en: "No external systems found", es: "No se encontraron sistemas externos" },
    emptyDescription: {
      en: "Get started by adding your first external system.",
      es: "Comienza agregando tu primer sistema externo.",
    },
    emptySearchDescription: {
      en: "No systems match your search. Try a different term.",
      es: "Ningún sistema coincide con tu búsqueda. Prueba otro término.",
    },
    loading: { en: "Loading systems...", es: "Cargando sistemas..." },
  },
  detail: {
    placeholder: {
      en: "Select a system to view its details",
      es: "Selecciona un sistema para ver sus detalles",
    },
    name: { en: "Name", es: "Nombre" },
    baseUrl: { en: "Base URL", es: "URL Base" },
    status: { en: "Status", es: "Estado" },
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
    empty: { en: "No external systems yet", es: "No hay sistemas externos aún" },
    noResults: { en: "No systems match your search", es: "Ningún sistema coincide con tu búsqueda" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load external systems", es: "Error al cargar los sistemas externos" },
    errorDescription: { en: "An error occurred while loading systems. Please try again.", es: "Ocurrió un error al cargar los sistemas. Por favor, inténtalo de nuevo." },
  },
  accessDenied: {
    title: { en: "Access Denied", es: "Acceso Denegado" },
    description: {
      en: "You don't have permission to access External Systems.",
      es: "No tienes permiso para acceder a los Sistemas Externos.",
    },
  },
  actions: {
    edit: { en: "Edit System", es: "Editar Sistema" },
    delete: { en: "Delete System", es: "Eliminar Sistema" },
    connect: { en: "Connect", es: "Conectar" },
    disconnect: { en: "Disconnect", es: "Desconectar" },
  },
  status: {
    connected: { en: "Connected", es: "Conectado" },
    disconnected: { en: "Disconnected", es: "Desconectado" },
    error: { en: "Error", es: "Error" },
  },
  create: {
    title: { en: "Add External System", es: "Agregar Sistema Externo" },
    description: {
      en: "Enter the details to connect a new external system.",
      es: "Ingresa los detalles para conectar un nuevo sistema externo.",
    },
    submitLabel: { en: "Add System", es: "Agregar Sistema" },
    success: { en: "System added successfully", es: "Sistema agregado correctamente" },
    errorFailed: { en: "Failed to add system", es: "Error al agregar el sistema" },
  },
  edit: {
    title: { en: "Edit External System", es: "Editar Sistema Externo" },
    description: {
      en: "Update the external system details.",
      es: "Actualiza los detalles del sistema externo.",
    },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: { en: "System updated successfully", es: "Sistema actualizado correctamente" },
    errorFailed: { en: "Failed to update system", es: "Error al actualizar el sistema" },
  },
  delete: {
    title: { en: "Delete External System", es: "Eliminar Sistema Externo" },
    description: {
      en: "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    confirmLabel: { en: "Delete", es: "Eliminar" },
    success: { en: "System deleted successfully", es: "Sistema eliminado correctamente" },
    errorFailed: { en: "Failed to delete system", es: "Error al eliminar el sistema" },
  },
}

export default translations
