const translations = {
  header: {
    title: { en: "Asset Type Relationships", es: "Relaciones de Tipos de Activo" },
    subtitle: {
      en: "Drag asset types from the left panel onto the canvas to build relationships",
      es: "Arrastra tipos de activo del panel izquierdo al canvas para crear relaciones",
    },
    searchPlaceholder: {
      en: "Search asset types...",
      es: "Buscar tipos de activo...",
    },
    assetTypes: { en: "Asset Types", es: "Tipos de Activo" },
    canvas: { en: "Relationships Canvas", es: "Canvas de Relaciones" },
    addRelationship: { en: "Add Relationship", es: "Agregar Relación" },
  },
  node: {
    sourceLabel: { en: "Source", es: "Origen" },
    targetLabel: { en: "Target", es: "Destino" },
    attributes: { en: "Attributes", es: "Atributos" },
    noAttributes: { en: "No attributes", es: "Sin atributos" },
    minCount: { en: "Min", es: "Mín" },
    maxCount: { en: "Max", es: "Máx" },
    unlimited: { en: "Unlimited", es: "Sin límite" },
    removeFromCanvas: {
      en: "Remove from Canvas",
      es: "Quitar del Canvas",
    },
    noRelationshipsFound: {
      en: "No relationships found for this asset type",
      es: "No se encontraron relaciones para este tipo de activo",
    },
    relationshipsLoaded: {
      en: "Loaded {{count}} relationship(s)",
      es: "Se cargaron {{count}} relación(es)",
    },
  },
  sidebar: {
    title: { en: "Asset Types", es: "Tipos de Activo" },
    dragHint: {
      en: "Drag to canvas to add",
      es: "Arrastra al canvas para agregar",
    },
    empty: { en: "No asset types found", es: "No se encontraron tipos de activo" },
    noResults: { en: "No results for \"{{term}}\"", es: "Sin resultados para \"{{term}}\"" },
    refresh: { en: "Refresh list", es: "Refrescar lista" },
  },
  canvas: {
    empty: {
      en: "Drag asset types here to start building relationships",
      es: "Arrastra tipos de activo aquí para comenzar a crear relaciones",
    },
    connectHint: {
      en: "Connect two asset type nodes to create a relationship",
      es: "Conecta dos nodos de tipos de activo para crear una relación",
    },
    clearAll: { en: "Clear canvas", es: "Limpiar canvas" },
    saveAsDiagram: { en: "Save as Diagram", es: "Guardar como Diagrama" },
    saveChanges: { en: "Save changes", es: "Guardar cambios" },
    loadDiagram: { en: "Load Diagram", es: "Cargar Diagrama" },
  },
  loadDiagramSheet: {
    title: { en: "Load Diagram", es: "Cargar Diagrama" },
    diagramLabel: { en: "Diagram", es: "Diagrama" },
    diagramPlaceholder: { en: "Search a diagram by name", es: "Busca un diagrama por nombre" },
    load: { en: "Load Diagram", es: "Cargar Diagrama" },
    notFound: { en: "Diagram not found.", es: "Diagrama no encontrado." },
    loadingError: { en: "Failed to load the diagram.", es: "Error al cargar el diagrama." },
  },
  saveAsDiagramDialog: {
    title: { en: "Save as Diagram", es: "Guardar como Diagrama" },
    updateTitle: { en: "Save changes to Diagram", es: "Guardar cambios del Diagrama" },
    nameLabel: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "e.g. Main content map", es: "ej. Mapa de contenido principal" },
    descriptionLabel: { en: "Description", es: "Descripción" },
    mainExecutionLabel: { en: "Main execution", es: "Ejecución principal" },
    mainExecutionPlaceholder: { en: "Select a version placed on the canvas", es: "Selecciona una versión ubicada en el lienzo" },
    save: { en: "Save Diagram", es: "Guardar Diagrama" },
    update: { en: "Save changes", es: "Guardar cambios" },
    successToast: { en: "Diagram created successfully", es: "Diagrama creado correctamente" },
    updateSuccessToast: { en: "Diagram updated successfully", es: "Diagrama actualizado correctamente" },
    viewDiagrams: { en: "View diagrams", es: "Ver diagramas" },
  },
  panel: {
    newRelationship: { en: "New Relationship", es: "Nueva Relación" },
    selectTarget: { en: "Select target node…", es: "Seleccionar nodo destino…" },
    relationships: { en: "Relationships", es: "Relaciones" },
    connection: { en: "Connection", es: "Conexión" },
    cardinality: { en: "Cardinality", es: "Cardinalidad" },
    type: { en: "Type", es: "Tipo" },
    manual: { en: "Manual", es: "Manual" },
    actions: { en: "Actions", es: "Acciones" },
    empty: {
      en: "No relationships yet. Connect nodes on the canvas or use the selector above.",
      es: "Sin relaciones aún. Conecta nodos en el canvas o usa el selector de arriba.",
    },
    edit: { en: "Edit", es: "Editar" },
    attributes: { en: "Attributes", es: "Atributos" },
    delete: { en: "Delete", es: "Eliminar" },
  },
  nodePanel: {
    assetType: { en: "Asset Type", es: "Tipo de Activo" },
    actions: { en: "Actions", es: "Acciones" },
    loadRelationships: { en: "Expand Relationships", es: "Expandir Relaciones" },
    loadRelationshipsDescription: {
      en: "Adds related nodes to the canvas, following the relationship chain",
      es: "Agrega al canvas los nodos relacionados, siguiendo la cadena de relaciones",
    },
    loadRelationshipsCanvasOnly: { en: "Connect Canvas Nodes", es: "Conectar Nodos del Canvas" },
    loadRelationshipsCanvasOnlyDescription: {
      en: "Only draws connections between nodes already on the canvas — no new nodes are added",
      es: "Solo dibuja conexiones entre los nodos que ya están en el canvas — no agrega nodos nuevos",
    },
    loadingRelationships: { en: "Loading…", es: "Cargando…" },
    version: { en: "Version", es: "Versión" },
    versionRequired: {
      en: "Select a version to enable connections",
      es: "Selecciona una versión para habilitar conexiones",
    },
    versionRequiredFor: {
      en: "Select a version for: {{names}}",
      es: "Selecciona una versión para: {{names}}",
    },
    versionAlreadyInCanvas: {
      en: "That version is already on the canvas.",
      es: "Esa versión ya está en el canvas.",
    },
  },
  relationship: {
    name: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "Relationship name", es: "Nombre de la relación" },
    source: { en: "Source Asset Type", es: "Tipo de Activo Origen" },
    target: { en: "Target Asset Type", es: "Tipo de Activo Destino" },
    minCount: { en: "Min Count", es: "Cantidad Mínima" },
    maxCount: { en: "Max Count", es: "Cantidad Máxima" },
    maxCountHint: { en: "0 means unlimited", es: "0 significa sin límite" },
    selfRelation: { en: "Self-relationship", es: "Autorelación" },
    type: { en: "Relationship Type", es: "Tipo de Relación" },
    noRelationshipsBetweenTypes: {
      en: "No relationship types defined between these asset types.",
      es: "No hay tipos de relación definidos entre estos tipos de activo.",
    },
    manualHint: {
      en: "No relationship type is configured between these asset types — create a manual relationship.",
      es: "No hay un tipo de relación configurado entre estos tipos de activo: crea una relación manual.",
    },
    manualName: { en: "Relationship name", es: "Nombre de la relación" },
    addAttribute: { en: "Add attribute", es: "Agregar atributo" },
    attributeName: { en: "Attribute name", es: "Nombre del atributo" },
    attributeValue: { en: "Value", es: "Valor" },
    noAttributes: { en: "This relationship has no attributes.", es: "Esta relación no tiene atributos." },
    sourceExecution: { en: "Source version ({{name}})", es: "Versión origen ({{name}})" },
    targetExecution: { en: "Target version ({{name}})", es: "Versión destino ({{name}})" },
    selectExecution: { en: "Select version…", es: "Seleccionar versión…" },
    noExecutions: { en: "No versions available for this asset.", es: "No hay versiones disponibles para este activo." },
    allVersionsInCanvas: {
      en: "All versions are already on the canvas.",
      es: "Todas las versiones ya están en el canvas.",
    },
  },
  attributes: {
    title: { en: "Attributes", es: "Atributos" },
    addAttribute: { en: "Add Attribute", es: "Agregar Atributo" },
    name: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "Attribute name", es: "Nombre del atributo" },
    valueType: { en: "Value Type", es: "Tipo de Valor" },
    isRequired: { en: "Required", es: "Requerido" },
    defaultValue: { en: "Default Value", es: "Valor Predeterminado" },
    defaultValuePlaceholder: {
      en: "Default value (optional)",
      es: "Valor predeterminado (opcional)",
    },
    displayOrder: { en: "Display Order", es: "Orden de Visualización" },
    empty: { en: "No attributes defined", es: "Sin atributos definidos" },
    valueTypes: {
      number: { en: "Number", es: "Número" },
      percentage: { en: "Percentage", es: "Porcentaje" },
      text: { en: "Text", es: "Texto" },
      date: { en: "Date", es: "Fecha" },
    },
  },
  create: {
    title: { en: "Create Relationship", es: "Crear Relación" },
    submitLabel: { en: "Create", es: "Crear" },
    success: {
      en: "Relationship created successfully",
      es: "Relación creada correctamente",
    },
  },
  edit: {
    title: { en: "Edit Relationship", es: "Editar Relación" },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: {
      en: "Relationship updated successfully",
      es: "Relación actualizada correctamente",
    },
    lockedHint: {
      en: "Some fields are locked because this relationship has existing instances",
      es: "Algunos campos están bloqueados porque esta relación tiene instancias existentes",
    },
  },
  delete: {
    title: { en: "Delete Relationship", es: "Eliminar Relación" },
    description: {
      en: "Are you sure you want to delete the relationship \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar la relación \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    confirmLabel: { en: "Delete", es: "Eliminar" },
    success: {
      en: "Relationship deleted successfully",
      es: "Relación eliminada correctamente",
    },
  },
  createAttribute: {
    title: { en: "Add Attribute", es: "Agregar Atributo" },
    submitLabel: { en: "Add", es: "Agregar" },
    success: {
      en: "Attribute added successfully",
      es: "Atributo agregado correctamente",
    },
  },
  editAttribute: {
    title: { en: "Edit Attribute", es: "Editar Atributo" },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: {
      en: "Attribute updated successfully",
      es: "Atributo actualizado correctamente",
    },
  },
  deleteAttribute: {
    title: { en: "Delete Attribute", es: "Eliminar Atributo" },
    description: {
      en: "Are you sure you want to delete the attribute \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar el atributo \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    confirmLabel: { en: "Delete", es: "Eliminar" },
    success: {
      en: "Attribute deleted successfully",
      es: "Atributo eliminado correctamente",
    },
  },
  actions: {
    edit: { en: "Edit", es: "Editar" },
    delete: { en: "Delete", es: "Eliminar" },
    manageAttributes: { en: "Manage Attributes", es: "Gestionar Atributos" },
  },
  errorState: {
    failedToLoad: {
      en: "Failed to load relationships",
      es: "Error al cargar las relaciones",
    },
    errorDescription: {
      en: "An error occurred. Please try again.",
      es: "Ocurrió un error. Por favor, inténtalo de nuevo.",
    },
  },
}

export default translations
