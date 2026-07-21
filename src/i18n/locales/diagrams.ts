const translations = {
  header: {
    title: { en: "Diagrams", es: "Diagramas" },
    searchPlaceholder: { en: "Search diagrams...", es: "Buscar diagramas..." },
  },
  filters: {
    execution: { en: "Execution", es: "Ejecución" },
    executionPlaceholder: { en: "All executions", es: "Todas las ejecuciones" },
  },
  columns: {
    name: { en: "Name", es: "Nombre" },
    execution: { en: "Execution", es: "Ejecución" },
    description: { en: "Description", es: "Descripción" },
    created: { en: "Created", es: "Creado" },
  },
  actions: {
    view: { en: "View", es: "Ver" },
    deleteDiagram: { en: "Delete Diagram", es: "Eliminar Diagrama" },
    clearFilters: { en: "Clear Filters", es: "Limpiar Filtros" },
  },
  deleteDialog: {
    title: { en: "Delete Diagram", es: "Eliminar Diagrama" },
    description: {
      en: "Are you sure you want to delete this diagram? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar este diagrama? Esta acción no se puede deshacer.",
    },
    nameLabel: { en: "Name", es: "Nombre" },
  },
  editSheet: {
    title: { en: "Diagram", es: "Diagrama" },
    loadingError: { en: "Failed to load the diagram.", es: "Error al cargar el diagrama." },
    notFound: { en: "Diagram not found.", es: "Diagrama no encontrado." },
  },
  relatedSheet: {
    title: { en: "Related Diagrams", es: "Diagramas Relacionados" },
    description: {
      en: "Diagrams that include this document.",
      es: "Diagramas que incluyen este documento.",
    },
    loadingError: { en: "Failed to load diagrams.", es: "Error al cargar los diagramas." },
    empty: {
      en: "This document isn't part of any diagram yet.",
      es: "Este documento aún no forma parte de ningún diagrama.",
    },
  },
  emptyState: {
    accessDeniedDescription: {
      en: "You don't have permission to view diagrams.",
      es: "No tienes permiso para ver diagramas.",
    },
    errorLoadingTitle: { en: "Error Loading Diagrams", es: "Error al Cargar Diagramas" },
    errorLoadingDescription: {
      en: "An error occurred while loading diagrams. Please try again.",
      es: "Ocurrió un error al cargar los diagramas. Inténtalo de nuevo.",
    },
  },
  contentEmptyState: {
    errorTitle: { en: "Failed to load diagrams", es: "Error al cargar diagramas" },
    errorDescription: {
      en: "An error occurred while loading diagrams.",
      es: "Ocurrió un error al cargar los diagramas.",
    },
    emptyTitle: { en: "No diagrams yet", es: "Aún no hay diagramas" },
    emptyDescription: {
      en: "Diagrams created for your executions will appear here.",
      es: "Los diagramas creados para tus ejecuciones aparecerán aquí.",
    },
    noResultsTitle: { en: "No results found", es: "No se encontraron resultados" },
    noResultsDescription: {
      en: "No diagrams match your search. Try clearing the filters.",
      es: "Ningún diagrama coincide con tu búsqueda. Intenta limpiar los filtros.",
    },
  },
}

export default translations
