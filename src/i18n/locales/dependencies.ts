const translations = {
  // assets-dependencies-sheet.tsx
  sheet: {
    buttonTooltip: { en: "Manage Dependencies", es: "Gestionar Dependencias" },
    buttonLabel: { en: "Dependencies", es: "Dependencias" },
    title: { en: "Document Dependencies", es: "Dependencias del Documento" },
    description: {
      en: "Configure document dependencies and relationships with other assets.",
      es: "Configura las dependencias y relaciones del documento con otros recursos.",
    },
    documentLabel: { en: "Document: {{name}}", es: "Documento: {{name}}" },
    documentDescription: {
      en: "Link this document with other documents, templates, or external resources to create relationships and shared context.",
      es: "Vincula este documento con otros documentos, plantillas o recursos externos para crear relaciones y contexto compartido.",
    },
  },
  // dependency-add.tsx
  loading: { en: "Loading dependencies...", es: "Cargando dependencias..." },
  errorLoading: { en: "Error loading dependencies", es: "Error al cargar las dependencias" },
  addSection: {
    title: { en: "Add New Dependency", es: "Agregar Nueva Dependencia" },
    adding: { en: "Adding dependency...", es: "Agregando dependencia..." },
  },
  currentSection: {
    title: { en: "Current Dependencies", es: "Dependencias Actuales" },
    badge: { en: "{{count}} dependencies", es: "{{count}} dependencias" },
  },
  empty: {
    title: { en: "No dependencies configured", es: "Sin dependencias configuradas" },
    description: {
      en: "Add document dependencies to create relationships and shared context.",
      es: "Agrega dependencias de documentos para crear relaciones y contexto compartido.",
    },
  },
  sectionLabel: { en: "Section: {{name}}", es: "Sección: {{name}}" },
  viewDocument: { en: "View Document", es: "Ver Documento" },
  removeDependency: { en: "Remove Dependency", es: "Eliminar Dependencia" },
  toast: {
    added: { en: "Dependency added successfully", es: "Dependencia agregada exitosamente" },
    removed: { en: "Dependency removed successfully", es: "Dependencia eliminada exitosamente" },
    loadFailed: { en: "Failed to load folder content", es: "Error al cargar el contenido de la carpeta" },
  },
  // dependency-delete-dialog.tsx
  deleteDialog: {
    title: { en: "Remove Dependency", es: "Eliminar Dependencia" },
    description: {
      en: "Are you sure you want to remove this dependency? This action cannot be undone and may affect document relationships.",
      es: "¿Estás seguro de que deseas eliminar esta dependencia? Esta acción no se puede deshacer y puede afectar las relaciones del documento.",
    },
    removeButton: { en: "Remove", es: "Eliminar" },
  },
}

export default translations
