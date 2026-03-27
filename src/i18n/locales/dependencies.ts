const translations = {
  // assets-dependencies-sheet.tsx
  sheet: {
    buttonTooltip: { en: "Manage Dependencies", es: "Gestionar Dependencias" },
    buttonLabel: { en: "Dependencies", es: "Dependencias" },
    title: { en: "Asset Dependencies", es: "Dependencias del Activo" },
    description: {
      en: "Configure asset dependencies and relationships with other assets.",
      es: "Configura las dependencias y relaciones del activo con otros recursos.",
    },
    documentLabel: { en: "Asset: {{name}}", es: "Activo: {{name}}" },
    documentDescription: {
      en: "Link this asset with other assets, templates, or external resources to create relationships and shared context.",
      es: "Vincula este activo con otros activos, plantillas o recursos externos para crear relaciones y contexto compartido.",
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
      en: "Add asset dependencies to create relationships and shared context.",
      es: "Agrega dependencias de activos para crear relaciones y contexto compartido.",
    },
  },
  sectionLabel: { en: "Section: {{name}}", es: "Sección: {{name}}" },
  viewDocument: { en: "View Asset", es: "Ver Activo" },
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
      en: "Are you sure you want to remove this dependency? This action cannot be undone and may affect asset relationships.",
      es: "¿Estás seguro de que deseas eliminar esta dependencia? Esta acción no se puede deshacer y puede afectar las relaciones del activo.",
    },
    removeButton: { en: "Remove", es: "Eliminar" },
  },
}

export default translations
