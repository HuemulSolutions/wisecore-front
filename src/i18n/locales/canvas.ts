const translations = {
  header: {
    title: { en: "Canvas", es: "Canvas" },
    createCanvas: { en: "Create Canvas", es: "Crear Canvas" },
    searchPlaceholder: { en: "Search canvas...", es: "Buscar canvas..." },
  },
  columns: {
    name: { en: "Name", es: "Nombre" },
    dimensions: { en: "Dimensions", es: "Dimensiones" },
    status: { en: "Status", es: "Estado" },
    editable: { en: "Editable", es: "Editable" },
  },
  status: {
    active: { en: "Active", es: "Activo" },
    inactive: { en: "Inactive", es: "Inactivo" },
  },
  actions: {
    editCanvas: { en: "Edit Canvas", es: "Editar Canvas" },
    deleteCanvas: { en: "Delete Canvas", es: "Eliminar Canvas" },
    createFirstCanvas: { en: "Create First Canvas", es: "Crear Primer Canvas" },
    clearFilters: { en: "Clear Filters", es: "Limpiar Filtros" },
  },
  createDialog: {
    title: { en: "Create Canvas", es: "Crear Canvas" },
    saveLabel: { en: "Create Canvas", es: "Crear Canvas" },
  },
  editDialog: {
    title: { en: "Edit Canvas", es: "Editar Canvas" },
    saveLabel: { en: "Update Canvas", es: "Actualizar Canvas" },
  },
  deleteDialog: {
    title: { en: "Delete Canvas", es: "Eliminar Canvas" },
    description: {
      en: "Are you sure you want to delete this canvas? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar este canvas? Esta acción no se puede deshacer.",
    },
    nameLabel: { en: "Name", es: "Nombre" },
  },
  form: {
    namePlaceholder: { en: "Enter canvas name", es: "Ingresa el nombre del canvas" },
    widthLabel: { en: "Width", es: "Ancho" },
    widthPlaceholder: { en: "e.g. 1920", es: "ej. 1920" },
    heightLabel: { en: "Height", es: "Alto" },
    heightPlaceholder: { en: "e.g. 1080", es: "ej. 1080" },
    isActiveLabel: { en: "Active", es: "Activo" },
    isEditableLabel: { en: "Editable", es: "Editable" },
  },
  emptyState: {
    accessDeniedDescription: {
      en: "You don't have permission to view canvas.",
      es: "No tienes permiso para ver canvas.",
    },
    errorLoadingTitle: { en: "Error Loading Canvas", es: "Error al Cargar Canvas" },
    errorLoadingDescription: {
      en: "An error occurred while loading canvas. Please try again.",
      es: "Ocurrió un error al cargar los canvas. Inténtalo de nuevo.",
    },
  },
  contentEmptyState: {
    errorTitle: { en: "Failed to load canvas", es: "Error al cargar canvas" },
    errorDescription: {
      en: "An error occurred while loading canvas.",
      es: "Ocurrió un error al cargar los canvas.",
    },
    emptyTitle: { en: "No canvas yet", es: "Aún no hay canvas" },
    emptyDescription: {
      en: "Create your first canvas to get started.",
      es: "Crea tu primer canvas para comenzar.",
    },
    noResultsTitle: { en: "No results found", es: "No se encontraron resultados" },
    noResultsDescription: {
      en: "No canvas match your search. Try clearing the filters.",
      es: "Ningún canvas coincide con tu búsqueda. Intenta limpiar los filtros.",
    },
  },
}

export default translations
