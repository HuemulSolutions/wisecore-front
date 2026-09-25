const translations = {
  permissionsDialog: {
    title: { en: "Share \"{{name}}\"", es: "Compartir \"{{name}}\"" },
    description: {
      en: "Choose which roles can view or administer this folder.",
      es: "Elegir qué roles pueden ver o administrar esta carpeta.",
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
      es: "Elegir un rol y los niveles de acceso que debería tener sobre esta carpeta.",
    },
    selectRolePlaceholder: { en: "Select a role...", es: "Seleccionar un rol..." },
    addButton: { en: "Add", es: "Agregar" },
    editButton: { en: "Edit access levels", es: "Editar niveles de acceso" },
    grantedSection: { en: "Roles with access", es: "Roles con acceso" },
    searchPlaceholder: { en: "Search roles...", es: "Buscar roles..." },
    noRolesFound: { en: "No roles found", es: "No se encontraron roles" },
    noRolesAvailable: { en: "No roles have access to this folder yet", es: "Todavía ningún rol tiene acceso a esta carpeta" },
    adjustSearch: { en: "Try adjusting your search", es: "Ajustar la búsqueda" },
    removeTitle: { en: "Revoke access", es: "Revocar acceso" },
    removeDescription: {
      en: "Remove all access that \"{{roleName}}\" has to \"{{folderName}}\"?",
      es: "¿Quitar todo el acceso que \"{{roleName}}\" tiene sobre \"{{folderName}}\"?",
    },
    removeButton: { en: "Revoke", es: "Revocar" },
    inheritance: {
      banner: {
        en: "This folder currently inherits permissions from \"{{folderName}}\". Granting the first permission here will stop that inheritance: only the roles listed here will have access.",
        es: "Esta carpeta hereda hoy los permisos de \"{{folderName}}\". Otorgar el primer acceso propio hará que deje de heredar: solo los roles listados aquí tendrán acceso.",
      },
      bannerGeneric: {
        en: "This folder currently inherits permissions from the folder that contains it. Granting the first permission here will stop that inheritance: only the roles listed here will have access.",
        es: "Esta carpeta hereda hoy los permisos de la carpeta que la contiene. Otorgar el primer acceso propio hará que deje de heredar: solo los roles listados aquí tendrán acceso.",
      },
      firstGrantTitle: { en: "Stop inheriting permissions", es: "Cortar la herencia de permisos" },
      firstGrantDescription: {
        en: "This folder has no permissions of its own yet — it inherits them from \"{{folderName}}\". Granting access to \"{{roleName}}\" will stop that inheritance: any role that could see this folder only because of \"{{folderName}}\" will lose access unless it's also granted here.",
        es: "Esta carpeta todavía no tiene permisos propios: hereda los de \"{{folderName}}\". Otorgar acceso a \"{{roleName}}\" hará que deje de heredar: cualquier rol que veía esta carpeta solo por \"{{folderName}}\" perderá el acceso salvo que también se le otorgue aquí.",
      },
      firstGrantDescriptionGeneric: {
        en: "This folder has no permissions of its own yet — it inherits them from the folder that contains it. Granting access to \"{{roleName}}\" will stop that inheritance: any role that could see this folder only through inheritance will lose access unless it's also granted here.",
        es: "Esta carpeta todavía no tiene permisos propios: hereda los de la carpeta que la contiene. Otorgar acceso a \"{{roleName}}\" hará que deje de heredar: cualquier rol que veía esta carpeta solo por herencia perderá el acceso salvo que también se le otorgue aquí.",
      },
      firstGrantConfirm: { en: "Grant and stop inheriting", es: "Otorgar y cortar herencia" },
      revokeLastWarning: {
        en: "This is the last permission of its own on this folder: removing it will make the folder inherit permissions from \"{{folderName}}\" again.",
        es: "Es el último acceso propio de esta carpeta: al quitarlo, la carpeta volverá a heredar los permisos de \"{{folderName}}\".",
      },
      revokeLastWarningGeneric: {
        en: "This is the last permission of its own on this folder: removing it will make the folder inherit permissions again.",
        es: "Es el último acceso propio de esta carpeta: al quitarlo, la carpeta volverá a heredar los permisos.",
      },
      inheritedEmpty: {
        en: "No role has its own access here yet — it currently inherits permissions from \"{{folderName}}\".",
        es: "Todavía ningún rol tiene acceso propio; hoy hereda los permisos de \"{{folderName}}\".",
      },
      inheritedEmptyGeneric: {
        en: "No role has its own access here yet — it currently inherits permissions from the folder that contains it.",
        es: "Todavía ningún rol tiene acceso propio; hoy hereda los permisos de la carpeta que la contiene.",
      },
    },
  },
  createSuccess: { en: "Access granted", es: "Acceso otorgado" },
  updateSuccess: { en: "Access updated", es: "Acceso actualizado" },
  revokeSuccess: { en: "Access revoked", es: "Acceso revocado" },
}

export default translations
