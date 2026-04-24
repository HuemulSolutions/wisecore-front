const translations = {
  addSecret: { en: "Add Secret", es: "Agregar Secreto" },
  refresh: { en: "Refresh secrets", es: "Actualizar secretos" },
  columns: {
    key: { en: "Key", es: "Clave" },
    name: { en: "Name", es: "Nombre" },
    value: { en: "Value", es: "Valor" },
  },
  masked: { en: "••••••••", es: "••••••••" },
  empty: {
    title: { en: "No secrets yet", es: "Sin secretos aún" },
    description: { en: "Click \"Add Secret\" to create one.", es: "Haz clic en \"Agregar Secreto\" para crear uno." },
  },
  add: {
    title: { en: "Add Secret", es: "Agregar Secreto" },
    description: { en: "Add a new secret to this external system.", es: "Agrega un nuevo secreto a este sistema externo." },
    submitLabel: { en: "Add Secret", es: "Agregar Secreto" },
    keyLabel: { en: "Key", es: "Clave" },
    keyPlaceholder: { en: "e.g. n8n-bearer", es: "ej. n8n-bearer" },
    nameLabel: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "e.g. N8N Connection Key", es: "ej. Clave de conexión N8N" },
    valueLabel: { en: "Value", es: "Valor" },
    valuePlaceholder: { en: "Secret value", es: "Valor secreto" },
  },
  edit: {
    valueHint: { en: "Leave empty to keep the current value", es: "Deja vacío para mantener el valor actual" },
  },
  delete: {
    title: { en: "Delete Secret", es: "Eliminar Secreto" },
    description: { en: "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.", es: "¿Estás seguro de que deseas eliminar \"{{name}}\"? Esta acción no se puede deshacer." },
    confirmLabel: { en: "Delete", es: "Eliminar" },
  },
}

export default translations
