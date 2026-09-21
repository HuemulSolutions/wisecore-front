const translations = {
  header: {
    title: { en: "Diagrams", es: "Diagramas" },
    searchPlaceholder: { en: "Search diagrams...", es: "Buscar diagramas..." },
  },
  rail: {
    tree: { en: "Knowledge tree", es: "Árbol de conocimiento" },
    list: { en: "Saved diagrams", es: "Diagramas guardados" },
    recents: { en: "Recent diagrams", es: "Diagramas recientes" },
    search: { en: "Search in the diagram", es: "Buscar en el diagrama" },
    navLabel: { en: "Diagram panels", es: "Paneles del diagrama" },
    close: { en: "Close panel", es: "Cerrar panel" },
  },
  listPanel: {
    counter: { en: "{{shown}} of {{total}}", es: "{{shown}} de {{total}}" },
    emptyTitle: { en: "No diagrams yet", es: "Todavía no hay diagramas" },
    emptyDescription: {
      en: "Diagrams you save in this organization will show up here, with their last edit date.",
      es: "Los diagramas que guardes en esta organización aparecerán aquí, con su fecha de última edición.",
    },
    noResults: { en: "No diagrams match “{{term}}”", es: "Ningún diagrama coincide con “{{term}}”" },
    viewAll: { en: "View all diagrams", es: "Ver todos los diagramas" },
    updatedAt: { en: "Edited {{date}}", es: "Editado {{date}}" },
  },
  recentsPanel: {
    emptyTitle: { en: "No recent diagrams", es: "Sin diagramas recientes" },
    emptyDescription: {
      en: "The last 6 diagrams you open in this browser will show up here.",
      es: "Aquí aparecerán los últimos 6 diagramas que abras en este navegador.",
    },
  },
  searchPanel: {
    title: { en: "Search in the diagram", es: "Buscar en el diagrama" },
    placeholder: { en: "Search nodes...", es: "Buscar nodos..." },
    counter: { en: "{{count}} match(es)", es: "{{count}} coincidencia(s)" },
    empty: { en: "No nodes match “{{term}}”", es: "Ningún nodo coincide con “{{term}}”" },
    hint: {
      en: "Type to filter the nodes of the open diagram. Click a result to center it.",
      es: "Escribe para filtrar los nodos del diagrama abierto. Haz clic en un resultado para centrarlo.",
    },
    untitledNode: { en: "Untitled", es: "Sin título" },
  },
  bar: {
    untitled: { en: "Untitled diagram", es: "Diagrama sin nombre" },
    unsaved: { en: "Unsaved", es: "Sin guardar" },
    saved: { en: "Saved", es: "Guardado" },
    saving: { en: "Saving…", es: "Guardando…" },
    save: { en: "Save", es: "Guardar" },
    more: { en: "More actions", es: "Más acciones" },
    rename: { en: "Double-click to rename", es: "Doble clic para renombrar" },
    renameLabel: { en: "Diagram name", es: "Nombre del diagrama" },
    saveAsNew: { en: "Save as new", es: "Guardar como nuevo" },
    editData: { en: "Edit diagram data", es: "Editar datos del diagrama" },
    duplicate: { en: "Duplicate", es: "Duplicar" },
    exportImage: { en: "Export image", es: "Exportar imagen" },
    refresh: { en: "Refresh", es: "Actualizar" },
    clear: { en: "Clear canvas", es: "Limpiar canvas" },
    delete: { en: "Delete", es: "Eliminar" },
    copyOf: { en: "{{name}} (copy)", es: "{{name}} (copia)" },
    duplicated: { en: "Diagram duplicated", es: "Diagrama duplicado" },
    exportError: { en: "Could not export the image", es: "No se pudo exportar la imagen" },
    renameError: { en: "Could not rename the diagram", es: "No se pudo renombrar el diagrama" },
  },
  canvasStates: {
    emptyTitle: { en: "Drag an asset to get started", es: "Arrastra un activo para empezar" },
    emptyDescription: {
      en: "Open the knowledge tree and drop a document or workflow here. Connect two nodes by dragging from a side handle to create a relationship.",
      es: "Abre el árbol de conocimiento y suelta aquí un documento o workflow. Conecta dos nodos arrastrando desde un punto lateral para crear una relación.",
    },
    openTree: { en: "Open tree", es: "Abrir árbol" },
    errorTitle: { en: "We couldn't open this diagram", es: "No pudimos abrir este diagrama" },
    errorDescription: {
      en: "It may have been deleted or you may not have permission to view it. The link points to",
      es: "Puede haberse eliminado o no tienes permiso para verlo. El enlace apunta a",
    },
    retry: { en: "Retry", es: "Reintentar" },
    viewMine: { en: "View my diagrams", es: "Ver mis diagramas" },
    loadingNamed: { en: "Loading “{{name}}”…", es: "Cargando “{{name}}”…" },
    loading: { en: "Loading the diagram…", es: "Cargando el diagrama…" },
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
    browseDiagrams: { en: "Diagrams", es: "Diagramas" },
    recentDiagrams: { en: "Recent", es: "Recientes" },
    deleteDiagram: { en: "Delete Diagram", es: "Eliminar Diagrama" },
    clearFilters: { en: "Clear Filters", es: "Limpiar Filtros" },
  },
  deleteDialog: {
    title: { en: "Delete Diagram", es: "Eliminar Diagrama" },
    description: {
      en: "Are you sure you want to delete this diagram? This action cannot be undone.",
      es: "¿Eliminar este diagrama? Esta acción no se puede deshacer.",
    },
    nameLabel: { en: "Name", es: "Nombre" },
  },
  editSheet: {
    title: { en: "Diagram", es: "Diagrama" },
    loadingError: { en: "Failed to load the diagram.", es: "Error al cargar el diagrama." },
    notFound: { en: "Diagram not found.", es: "Diagrama no encontrado." },
    editAction: { en: "Edit", es: "Editar" },
  },
  relatedSheet: {
    title: { en: "Related Diagrams", es: "Diagramas Relacionados" },
    description: {
      en: "Diagrams that include this asset.",
      es: "Diagramas que incluyen este activo.",
    },
    loadingError: { en: "Failed to load diagrams.", es: "Error al cargar los diagramas." },
    empty: {
      en: "This asset isn't part of any diagram yet.",
      es: "Este activo aún no forma parte de ningún diagrama.",
    },
    createAction: { en: "New diagram", es: "Nuevo diagrama" },
  },
  emptyState: {
    accessDeniedDescription: {
      en: "You don't have permission to view diagrams.",
      es: "No hay permiso para ver diagramas.",
    },
    errorLoadingTitle: { en: "Error Loading Diagrams", es: "Error al Cargar Diagramas" },
    errorLoadingDescription: {
      en: "An error occurred while loading diagrams. Please try again.",
      es: "Ocurrió un error al cargar los diagramas. Reintentar.",
    },
  },
  explorer: {
    title: { en: "Diagrams for this version", es: "Diagramas de esta versión" },
    subtitle: { en: "{{asset}} — {{execution}}", es: "{{asset}} — {{execution}}" },
    diagramsCount: { en: "{{count}} diagram(s)", es: "{{count}} diagrama(s)" },
    back: { en: "Back to diagram", es: "Volver al diagrama" },
    currentBadge: { en: "Current", es: "Actual" },
    empty: {
      en: "This version isn't assigned to any diagram yet.",
      es: "Esta versión aún no está asignada a ningún diagrama.",
    },
    loadingError: {
      en: "Failed to load the diagrams for this version.",
      es: "Error al cargar los diagramas de esta versión.",
    },
    createAction: { en: "New diagram", es: "Nuevo diagrama" },
    nodesCount: { en: "{{count}} node(s)", es: "{{count}} nodo(s)" },
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
      es: "Los diagramas creados para las ejecuciones aparecerán aquí.",
    },
    noResultsTitle: { en: "No results found", es: "No se encontraron resultados" },
    noResultsDescription: {
      en: "No diagrams match your search. Try clearing the filters.",
      es: "Ningún diagrama coincide con la búsqueda. Limpiar los filtros.",
    },
  },
}

export default translations
