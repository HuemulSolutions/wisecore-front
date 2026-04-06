const translations = {
  header: {
    title: { en: "Authentication Types", es: "Tipos de Autenticación" },
    addAuthType: { en: "Add Auth Type", es: "Agregar Tipo de Autenticación" },
    searchPlaceholder: { en: "Search authentication types...", es: "Buscar tipos de autenticación..." },
    authTypesCount: { en: "{{count}} auth types", es: "{{count}} tipos de autenticación" },
  },
  columns: {
    type: { en: "Type", es: "Tipo" },
    created: { en: "Created", es: "Creado" },
    updated: { en: "Updated", es: "Actualizado" },
  },
  types: {
    internal: { en: "Internal", es: "Interno" },
    entra: { en: "Entra ID (SAML2)", es: "Entra ID (SAML2)" },
  },
  actions: {
    editAuthType: { en: "Edit Auth Type", es: "Editar Tipo de Autenticación" },
    deleteAuthType: { en: "Delete Auth Type", es: "Eliminar Tipo de Autenticación" },
  },
  footer: {
    showing: { en: "Showing {{filtered}} of {{total}} authentication types", es: "Mostrando {{filtered}} de {{total}} tipos de autenticación" },
    internalTypes: { en: "internal types", es: "tipos internos" },
  },
  createDialog: {
    title: { en: "Create Authentication Type", es: "Crear Tipo de Autenticación" },
    namePlaceholder: { en: "Enter authentication type name", es: "Ingrese el nombre del tipo de autenticación" },
    typePlaceholder: { en: "Select authentication type", es: "Seleccione el tipo de autenticación" },
  },
  editDialog: {
    title: { en: "Edit Authentication Type", es: "Editar Tipo de Autenticación" },
    namePlaceholder: { en: "Enter authentication type name", es: "Ingrese el nombre del tipo de autenticación" },
    typePlaceholder: { en: "Select authentication type", es: "Seleccione el tipo de autenticación" },
  },
  deleteDialog: {
    title: { en: "Are you sure?", es: "¿Estás seguro?" },
    description: { en: "This action cannot be undone. This will permanently delete the authentication type \"{{name}}\".", es: "Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de autenticación \"{{name}}\"." },
  },
  emptyState: {
    noResults: { en: "No authentication types found matching your search", es: "No se encontraron tipos de autenticación que coincidan con tu búsqueda" },
    empty: { en: "No authentication types found", es: "No se encontraron tipos de autenticación" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load authentication types", es: "Error al cargar los tipos de autenticación" },
    errorDescription: { en: "There was an error loading the data. Please try again.", es: "Hubo un error al cargar los datos. Por favor, intenta de nuevo." },
  },
}

export default translations
