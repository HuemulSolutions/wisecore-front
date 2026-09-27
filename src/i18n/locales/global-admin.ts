const translations = {
  title: { en: "Global Admin Settings", es: "Configuración de Administración Global" },
  description: {
    en: "Cross-organization control: every organization and every user in the installation, regardless of role.",
    es: "Control cruzado entre organizaciones: todas las organizaciones y todos los usuarios de la instalación, sin importar el rol.",
  },
  // Copy diferenciador de /global-admin frente a /organizations y /users:
  // acá se ve y gestiona TODO (límites de sistema, membership cross-org),
  // no solo lo alcanzable con el rol de la organización activa.
  tabs: {
    organizations: { en: "All Organizations", es: "Todas las Organizaciones" },
    users: { en: "All Users", es: "Todos los Usuarios" },
  },
  sections: {
    organizationsSubtitle: {
      en: "Every organization in the installation, including system limits.",
      es: "Todas las organizaciones de la instalación, incluidos los límites de sistema.",
    },
    usersSubtitle: {
      en: "Every user across every organization.",
      es: "Todos los usuarios de todas las organizaciones.",
    },
  },
  accessDenied: {
    description: {
      en: "You don't have permission to access Global Admin Settings.",
      es: "No hay permisos para acceder a la Configuración de Administración Global.",
    },
  },
  // Sin bloque `toast` propio: ambas secciones ahora usan los hooks
  // compartidos (`useOrganizationMutations`, `useUserMutations`), cuyos
  // toasts salen de los namespaces `organizations`/`users` vía
  // `meta.successMessage` — ver ia context/refactor-module-guide.md.
}

export default translations
