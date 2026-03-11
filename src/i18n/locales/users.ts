const translations = {
  header: {
    title: { en: "Users Management", es: "Gestión de Usuarios" },
    addUser: { en: "Add User", es: "Agregar Usuario" },
    searchPlaceholder: { en: "Search users...", es: "Buscar usuarios..." },
    usersCount: { en: "{{count}} users", es: "{{count}} usuarios" },
    filterAllStatus: { en: "All Status", es: "Todos los estados" },
    filterActive: { en: "Active", es: "Activo" },
    filterInactive: { en: "Inactive", es: "Inactivo" },
    filterPending: { en: "Pending", es: "Pendiente" },
  },
  columns: {
    rootAdmin: { en: "Root Admin", es: "Admin Root" },
    created: { en: "Created", es: "Creado" },
  },
  activated: { en: "Activated: {{date}}", es: "Activado: {{date}}" },
  actions: {
    approveUser: { en: "Approve User", es: "Aprobar Usuario" },
    rejectUser: { en: "Reject User", es: "Rechazar Usuario" },
    assignToOrganization: { en: "Assign to Organization", es: "Asignar a Organización" },
    manageRootAdmin: { en: "Manage Root Admin", es: "Gestionar Admin Root" },
    makeOrgAdmin: { en: "Make Organization Admin", es: "Hacer Admin de Organización" },
    editUser: { en: "Edit User", es: "Editar Usuario" },
    deleteUser: { en: "Delete User", es: "Eliminar Usuario" },
  },
  emptyState: {
    title: { en: "No users found", es: "No se encontraron usuarios" },
    description: { en: "No users have been created yet or match your search criteria.", es: "Aún no se han creado usuarios o no coinciden con tus criterios de búsqueda." },
  },
}

export default translations
