const translations = {
  // assets-dependencies-sheet.tsx
  sheet: {
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
    adding: { en: "Adding dependency...", es: "Agregando dependencia..." },
  },
  currentSection: {
    badge: { en: "{{count}} dependencies", es: "{{count}} dependencias" },
  },
  viewDocument: { en: "View Asset", es: "Ver Activo" },
  removeDependency: { en: "Remove Dependency", es: "Eliminar Dependencia" },
  changeVersion: { en: "Change Version", es: "Cambiar Versión" },
  toast: {
    added: { en: "Dependency added successfully", es: "Dependencia agregada exitosamente" },
    removed: { en: "Dependency removed successfully", es: "Dependencia eliminada exitosamente" },
    versionUpdated: { en: "Dependency version updated", es: "Versión de la dependencia actualizada" },
    loadFailed: { en: "Failed to load folder content", es: "Error al cargar el contenido de la carpeta" },
    addFailed: { en: "Failed to add dependency", es: "Error al agregar la dependencia" },
    updateFailed: { en: "Failed to update dependency version", es: "Error al actualizar la versión de la dependencia" },
    removeFailed: { en: "Failed to remove dependency", es: "Error al eliminar la dependencia" },
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
  // version selection (version_mode)
  versionMode: {
    label: { en: "Version to use", es: "Versión a usar" },
    published: { en: "Current published version", es: "Versión publicada vigente" },
    publishedHint: {
      en: "Always resolves to whatever version is published at the time.",
      es: "Siempre resuelve a la versión publicada vigente en cada momento.",
    },
    latestApproved: { en: "Latest approved version", es: "Última versión aprobada" },
    latestApprovedHint: {
      en: "Uses the most recent version that reached at least the approved state.",
      es: "Usa la versión más reciente que alcanzó al menos el estado aprobado.",
    },
    specific: { en: "Specific version", es: "Versión específica" },
    specificHint: {
      en: "Fixed to the version you pick — it won't change even if newer versions are published later.",
      es: "Queda fija en la versión elegida, aunque después se publiquen versiones más nuevas.",
    },
    specificNoPermission: {
      en: "You don't have permission to list this asset's versions",
      es: "No tienes permiso para listar las versiones de este activo",
    },
    badge: {
      published: { en: "Published", es: "Publicada" },
      latestApproved: { en: "Latest approved", es: "Última aprobada" },
      specificFallback: { en: "Specific version", es: "Versión específica" },
    },
  },
  versionDialog: {
    createTitle: { en: "Add dependency", es: "Agregar dependencia" },
    editTitle: { en: "Change dependency version", es: "Cambiar versión de la dependencia" },
    documentLabel: { en: "Asset: {{name}}", es: "Activo: {{name}}" },
    executionLabel: { en: "Version", es: "Versión" },
    executionPlaceholder: { en: "Select a version...", es: "Selecciona una versión..." },
    executionEmpty: { en: "This asset has no versions yet", es: "Este activo aún no tiene versiones" },
    confirmCreate: { en: "Add", es: "Agregar" },
    confirmEdit: { en: "Save", es: "Guardar" },
  },
}

export default translations
