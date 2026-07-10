const translations = {
  permissionsDialog: {
    title: { en: "Share \"{{name}}\"", es: "Compartir \"{{name}}\"" },
    description: {
      en: "Choose which roles can view or administer this folder.",
      es: "Elige qué roles pueden ver o administrar esta carpeta.",
    },
    view: { en: "View", es: "Ver" },
    viewDescription: {
      en: "Can open and read the contents of this folder.",
      es: "Puede abrir y leer el contenido de esta carpeta.",
    },
    administer: { en: "Administer", es: "Administrar" },
    administerDescription: {
      en: "Can also manage settings and permissions for this folder.",
      es: "Además puede administrar la configuración y los permisos de esta carpeta.",
    },
    grantSection: { en: "Grant access to a role", es: "Otorgar acceso a un rol" },
    grantSectionDescription: {
      en: "Pick a role and the access levels it should have on this folder.",
      es: "Elige un rol y los niveles de acceso que debería tener sobre esta carpeta.",
    },
    selectRolePlaceholder: { en: "Select a role...", es: "Selecciona un rol..." },
    addButton: { en: "Add", es: "Agregar" },
    editButton: { en: "Edit access levels", es: "Editar niveles de acceso" },
    grantedSection: { en: "Roles with access", es: "Roles con acceso" },
    searchPlaceholder: { en: "Search roles...", es: "Buscar roles..." },
    noRolesFound: { en: "No roles found", es: "No se encontraron roles" },
    noRolesAvailable: { en: "No roles have access to this folder yet", es: "Todavía ningún rol tiene acceso a esta carpeta" },
    adjustSearch: { en: "Try adjusting your search", es: "Intenta ajustar tu búsqueda" },
    removeTitle: { en: "Revoke access", es: "Revocar acceso" },
    removeDescription: {
      en: "Remove all access that \"{{roleName}}\" has to \"{{folderName}}\"?",
      es: "¿Quitar todo el acceso que \"{{roleName}}\" tiene sobre \"{{folderName}}\"?",
    },
    removeButton: { en: "Revoke", es: "Revocar" },
  },
  createSuccess: { en: "Access granted", es: "Acceso otorgado" },
  updateSuccess: { en: "Access updated", es: "Acceso actualizado" },
  revokeSuccess: { en: "Access revoked", es: "Acceso revocado" },
}

export default translations
