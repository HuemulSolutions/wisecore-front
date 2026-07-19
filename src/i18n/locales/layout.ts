const translations = {
  nav: {
    home: { en: "Home", es: "Inicio" },
    assets: { en: "Assets", es: "Activos" },
    search: { en: "Search", es: "Búsqueda" },
    templates: { en: "Templates", es: "Plantillas" },
    advanced: { en: "Advanced", es: "Avanzado" },
    media: { en: "Media", es: "Media" },
    navigationMenuTitle: { en: "Navigation", es: "Navegación" },
  },
  header: {
    applicationVersion: { en: "Application Version", es: "Versión de la Aplicación" },
    settingsMenuSrOnly: { en: "Settings menu", es: "Menú de configuración" },
    updateProfile: { en: "Update Profile", es: "Actualizar Perfil" },
    notifications: { en: "Notifications", es: "Notificaciones" },
    mySubscriptions: { en: "My Subscriptions", es: "Mis Suscripciones" },
    signOut: { en: "Sign out", es: "Cerrar sesión" },
  },
  settings: {
    assetManagement: { en: "Asset Management", es: "Gestión de Activos" },
    assetTypes: { en: "Asset Types", es: "Tipos de Activo" },
    assetTypeRelationships: { en: "Asset Type Relationships", es: "Relaciones de Tipos de Activo" },
    customFields: { en: "Custom Fields", es: "Campos Personalizados" },
    canvas: { en: "Canvas", es: "Canvas" },
    diagrams: { en: "Diagrams", es: "Diagramas" },
    media: { en: "Media", es: "Media" },
    administration: { en: "Administration", es: "Administración" },
    organizations: { en: "Organizations", es: "Organizaciones" },
    globalAdminSettings: { en: "Global Admin Settings", es: "Configuración de Admin Global" },
    users: { en: "Users", es: "Usuarios" },
    roles: { en: "Roles", es: "Roles" },
    models: { en: "Models", es: "Modelos" },
    authTypes: { en: "Auth Types", es: "Tipos de Autenticación" },
    externalSystems: { en: "External Systems", es: "Sistemas Externos" },
    advanced: { en: "Advanced", es: "Avanzado" },
  },
  knowledge: {
    sectionTitle: { en: "Knowledge", es: "Conocimiento" },
    newAsset: { en: "New Asset", es: "Nuevo Activo" },
    importAsset: { en: "New Asset from File", es: "Nuevo Activo desde Archivo" },
    importConfig: { en: "Import portable", es: "Importar portable" },
    newFolder: { en: "New Folder", es: "Nueva Carpeta" },
    newGroupFolder: { en: "New Group Folder", es: "Nueva Carpeta Grupal" },
    newArea: { en: "New Area", es: "Nueva Área" },
    shareFolder: { en: "Share", es: "Compartir" },
    editFolder: { en: "Edit Folder", es: "Editar Carpeta" },
    deleteFolder: { en: "Delete Folder", es: "Eliminar Carpeta" },
    editFile: { en: "Edit File", es: "Editar Archivo" },
    assetPermissions: { en: "Asset Permissions", es: "Permisos del Activo" },
    deleteFile: { en: "Delete File", es: "Eliminar Archivo" },
    folderDeletedSuccess: {
      en: "Folder \"{{name}}\" deleted successfully",
      es: "Carpeta \"{{name}}\" eliminada correctamente",
    },
    folderDeleteError: {
      en: "Failed to delete folder. Please try again.",
      es: "Error al eliminar la carpeta. Inténtalo de nuevo.",
    },
    documentDeletedSuccess: {
      en: "Asset \"{{name}}\" deleted successfully",
      es: "Activo \"{{name}}\" eliminado correctamente",
    },
    documentDeleteError: {
      en: "Failed to delete asset. Please try again.",
      es: "Error al eliminar el activo. Inténtalo de nuevo.",
    },
    folderMovedSuccess: { en: "Folder moved to \"{{destination}}\"", es: "Carpeta movida a \"{{destination}}\"" },
    folderMoveError: {
      en: "Failed to move folder. Please try again.",
      es: "Error al mover la carpeta. Inténtalo de nuevo.",
    },
    documentMovedSuccess: { en: "Asset moved to \"{{destination}}\"", es: "Activo movido a \"{{destination}}\"" },
    documentMoveError: {
      en: "Failed to move asset. Please try again.",
      es: "Error al mover el activo. Inténtalo de nuevo.",
    },
    moveToRoot: { en: "Move to Root", es: "Mover al Raíz" },
    rootFolder: { en: "Root", es: "Raíz" },
    searchPlaceholder: { en: "Search assets...", es: "Buscar activos..." },
    searchNoResults: { en: "No results found", es: "No se encontraron resultados" },
    relationsMode: { en: "Relations", es: "Relaciones" },
    relationsModeTitle: { en: "Relations", es: "Relaciones" },
    relationsModeTooltip: { en: "Relations mode", es: "Modo relaciones" },
    errors: {
      folderNotAccessible: {
        en: "You don't have access to this folder",
        es: "No tienes acceso a esta carpeta",
      },
      folderLoadError: {
        en: "Failed to load folder content. Please try again.",
        es: "Error al cargar el contenido de la carpeta. Inténtalo de nuevo.",
      },
      folderNotDeletable: {
        en: "This folder can't be deleted",
        es: "Esta carpeta no se puede eliminar",
      },
      folderNotMovable: {
        en: "This folder can't be moved",
        es: "Esta carpeta no se puede mover",
      },
      folderNotRenamable: {
        en: "This folder can't be renamed",
        es: "Esta carpeta no se puede renombrar",
      },
      folderAdministerRequired: {
        en: "You need administer access to this folder",
        es: "Necesitas acceso de administrador sobre esta carpeta",
      },
      orgAdminRequired: {
        en: "Only an organization admin can do this",
        es: "Solo un administrador de la organización puede hacer esto",
      },
      manageGroupsRequired: {
        en: "You need the 'manage groups' permission to do this",
        es: "Necesitas el permiso de 'administrar grupos' para hacer esto",
      },
      folderNotGrantable: {
        en: "Access can't be granted on this folder",
        es: "No se puede otorgar acceso sobre esta carpeta",
      },
    },
  },
  llmConfigBanner: {
    llmNotConfigured: {
      en: "Default LLM is not configured. AI features will not work until a default LLM is set up.",
      es: "El LLM predeterminado no está configurado. Las funcionalidades de IA no funcionarán hasta configurarlo.",
    },
    llmNotWorking: {
      en: "Default LLM is configured but not working. Please check your LLM settings.",
      es: "El LLM predeterminado está configurado pero no funciona. Por favor, revisa la configuración.",
    },
    embeddingNotConfigured: {
      en: "Embedding provider is not configured. Semantic search and AI features may not work.",
      es: "El proveedor de embeddings no está configurado. La búsqueda semántica y las funcionalidades de IA pueden no funcionar.",
    },
    embeddingNotWorking: {
      en: "Embedding provider is configured but not working. Please check your embedding settings.",
      es: "El proveedor de embeddings está configurado pero no funciona. Por favor, revisa la configuración.",
    },
    configure: { en: "Configure", es: "Configurar" },
    dismiss: { en: "Dismiss", es: "Cerrar" },
  },
}

export default translations
