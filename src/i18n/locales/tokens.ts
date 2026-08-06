const translations = {
  header: {
    title: { en: "API Tokens", es: "Tokens de API" },
    description: {
      en: "Manage the API tokens used to authenticate requests to Wisecore.",
      es: "Administra los tokens de API usados para autenticar solicitudes a Wisecore.",
    },
    newToken: { en: "New token", es: "Nuevo token" },
  },
  list: {
    columnName: { en: "Name", es: "Nombre" },
    columnToken: { en: "Token", es: "Token" },
    columnDuration: { en: "Duration", es: "Duración" },
    columnExpiresAt: { en: "Expires at", es: "Expira el" },
    columnCreatedAt: { en: "Created at", es: "Creado el" },
    durationDays: { en: "{{count}} days", es: "{{count}} días" },
    empty: { en: "No API tokens yet", es: "Aún no hay tokens de API" },
    emptyDescription: {
      en: "Create a token to authenticate external requests to the API.",
      es: "Crea un token para autenticar solicitudes externas a la API.",
    },
    loading: { en: "Loading tokens...", es: "Cargando tokens..." },
  },
  create: {
    title: { en: "New API token", es: "Nuevo token de API" },
    description: {
      en: "Give the token a name and a validity period.",
      es: "Dale un nombre al token y define su periodo de validez.",
    },
    namePlaceholder: { en: "e.g. CI pipeline", es: "ej. Pipeline de CI" },
    durationLabel: { en: "Duration", es: "Duración" },
    submitLabel: { en: "Create token", es: "Crear token" },
    errorFailed: { en: "Failed to create token", es: "Error al crear el token" },
  },
  reveal: {
    title: { en: "Token created", es: "Token creado" },
    warning: {
      en: "Copy this token now. For security reasons, it won't be shown again.",
      es: "Copia este token ahora. Por seguridad, no se volverá a mostrar.",
    },
    doneLabel: { en: "Done", es: "Listo" },
  },
}

export default translations
