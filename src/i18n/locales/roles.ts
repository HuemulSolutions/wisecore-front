const translations = {
  header: {
    title: { en: "Roles & Permissions", es: "Roles y Permisos" },
    createRole: { en: "Create Role", es: "Crear Rol" },
    searchPlaceholder: { en: "Search roles...", es: "Buscar roles..." },
    rolesCount: { en: "{{count}} roles", es: "{{count}} roles" },
  },
  columns: {
    roleName: { en: "Role Name", es: "Nombre del Rol" },
    permissions: { en: "Permissions", es: "Permisos" },
    created: { en: "Created", es: "Creado" },
  },
  table: {
    showingOf: { en: "Showing {{filtered}} of {{total}} roles", es: "Mostrando {{filtered}} de {{total}} roles" },
    totalPermissions: { en: "total permissions", es: "permisos totales" },
  },
  actions: {
    assignToUsers: { en: "Assign to Users", es: "Asignar a Usuarios" },
    managePermissions: { en: "Manage Permissions", es: "Gestionar Permisos" },
    deleteRole: { en: "Delete Role", es: "Eliminar Rol" },
    loadingUsers: { en: "Loading users...", es: "Cargando usuarios..." },
  },
  create: {
    title: { en: "Create New Role", es: "Crear Nuevo Rol" },
    description: { en: "Create a new role with specific permissions to control user access.", es: "Crea un nuevo rol con permisos específicos para controlar el acceso de los usuarios." },
    button: { en: "Create Role", es: "Crear Rol" },
  },
  edit: {
    title: { en: "Edit Permissions: {{name}}", es: "Editar Permisos: {{name}}" },
    description: { en: "Update the permissions assigned to this role.", es: "Actualiza los permisos asignados a este rol." },
  },
  delete: {
    title: { en: "Delete Role", es: "Eliminar Rol" },
    description: { en: "Are you sure you want to delete the role \"{{name}}\"? This action cannot be undone and will remove all assignments of this role.", es: "¿Estás seguro de que deseas eliminar el rol \"{{name}}\"? Esta acción no se puede deshacer y eliminará todas las asignaciones de este rol." },
  },
  assignToUsers: {
    title: { en: "Assign Users", es: "Asignar Usuarios" },
    description: { en: "Assign users to the role {{name}}", es: "Asignar usuarios al rol {{name}}" },
    availableUsers: { en: "Available Users", es: "Usuarios Disponibles" },
    selectAll: { en: "Select All ({{count}})", es: "Seleccionar Todo ({{count}})" },
    button: { en: "Assign Users", es: "Asignar Usuarios" },
    noUsers: { en: "No users available", es: "No hay usuarios disponibles" },
    noUsersCreated: { en: "No users have been created yet.", es: "Aún no se han creado usuarios." },
    noUsersFound: { en: "No users found", es: "No se encontraron usuarios" },
    adjustSearch: { en: "Try adjusting your search criteria.", es: "Intenta ajustar tus criterios de búsqueda." },
    errorLoading: { en: "Failed to load users", es: "Error al cargar los usuarios" },
    errorDescription: { en: "There was an error loading the users data. Please try again.", es: "Ocurrió un error al cargar los datos de usuarios. Por favor, inténtalo de nuevo." },
  },
  assignRoles: {
    title: { en: "Assign Roles", es: "Asignar Roles" },
    description: { en: "Assign roles to {{name}} ({{email}})", es: "Asignar roles a {{name}} ({{email}})" },
    availableRoles: { en: "Available Roles", es: "Roles Disponibles" },
    button: { en: "Assign Roles", es: "Asignar Roles" },
    noRoles: { en: "No roles available", es: "No hay roles disponibles" },
    noRolesCreated: { en: "No roles have been created yet.", es: "Aún no se han creado roles." },
    errorLoading: { en: "Failed to load roles", es: "Error al cargar los roles" },
    errorDescription: { en: "There was an error loading the roles data. Please try again.", es: "Ocurrió un error al cargar los datos de roles. Por favor, inténtalo de nuevo." },
  },
  permissions: {
    title: { en: "Role Permissions", es: "Permisos del Rol" },
    selected: { en: "{{count}} selected", es: "{{count}} seleccionados" },
    searchPlaceholder: { en: "Search permissions...", es: "Buscar permisos..." },
    selectAll: { en: "Select all", es: "Seleccionar todo" },
    all: { en: "All", es: "Todo" },
  },
  permissionsDialog: {
    title: { en: "Role Permissions - {{name}}", es: "Permisos del Rol - {{name}}" },
    description: { en: "Configure access levels for each role for this asset type.", es: "Configura los niveles de acceso para cada rol en este tipo de activo." },
    searchPlaceholder: { en: "Search roles...", es: "Buscar roles..." },
    roleColumn: { en: "Role", es: "Rol" },
    noRolesFound: { en: "No roles found", es: "No se encontraron roles" },
    adjustSearch: { en: "Try adjusting your search criteria.", es: "Intenta ajustar tus criterios de búsqueda." },
    noRolesAvailable: { en: "No roles are available.", es: "No hay roles disponibles." },
    savePermissions: { en: "Save Permissions", es: "Guardar Permisos" },
  },
  form: {
    roleName: { en: "Role Name", es: "Nombre del Rol" },
    description: { en: "Description", es: "Descripción" },
    roleNamePlaceholder: { en: "Enter role name", es: "Ingresa el nombre del rol" },
    descriptionPlaceholder: { en: "Enter role description", es: "Ingresa la descripción del rol" },
  },
  emptyState: {
    noRolesFound: { en: "No roles found", es: "No se encontraron roles" },
    noRolesCreated: { en: "No roles have been created yet.", es: "Aún no se han creado roles." },
    adjustSearch: { en: "Try adjusting your search criteria.", es: "Intenta ajustar tus criterios de búsqueda." },
    createFirst: { en: "Create First Role", es: "Crear Primer Rol" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load roles", es: "Error al cargar los roles" },
    errorDescription: { en: "There was an error loading the data. Please try again.", es: "Ocurrió un error al cargar los datos. Por favor, inténtalo de nuevo." },
  },
  accessDenied: {
    description: { en: "You don't have permission to access role management.", es: "No tienes permiso para acceder a la gestión de roles." },
  },
}

export default translations
