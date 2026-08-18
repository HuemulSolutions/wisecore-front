const translations = {
  header: {
    title: { en: "Tags", es: "Etiquetas" },
    addTag: { en: "New tag", es: "Nueva etiqueta" },
    searchPlaceholder: { en: "Search by name...", es: "Buscar por nombre..." },
    // Sin "total en la organización": el backend no devuelve un total agregado
    // (TagsResponse solo trae has_next), así que este número es el conteo de
    // la página actual — mismo criterio ambiguo que ya acepta el resto del
    // repo (ver customFieldCount en custom-fields-page-header.tsx).
    tagsCount: { en: "{{count}} tags", es: "{{count}} etiquetas" },
  },
  columns: {
    tag: { en: "Tag", es: "Etiqueta" },
    description: { en: "Description", es: "Descripción" },
    noDescription: { en: "No description", es: "Sin descripción" },
  },
  actions: {
    editTag: { en: "Edit tag", es: "Editar etiqueta" },
    deleteTag: { en: "Delete tag", es: "Eliminar etiqueta" },
  },
  form: {
    namePlaceholder: { en: "e.g. Urgent", es: "ej. Urgente" },
    nameRequired: { en: "Name is required", es: "El nombre es obligatorio" },
    colorLabel: { en: "Color", es: "Color" },
    colorHint: { en: "Free text: saved exactly as sent.", es: "Texto libre: se guarda tal cual se envía." },
    descriptionLabel: { en: "Description", es: "Descripción" },
    descriptionPlaceholder: { en: "Optional description", es: "Descripción opcional" },
    previewLabel: { en: "Preview", es: "Vista previa" },
    previewPlaceholder: { en: "Tag name", es: "Nombre de la etiqueta" },
    previewCaption: { en: "how it will look in an object's detail", es: "como se verá en el detalle de un objeto" },
  },
  createDialog: {
    title: { en: "New tag", es: "Nueva etiqueta" },
  },
  editDialog: {
    title: { en: "Edit tag", es: "Editar etiqueta" },
  },
  deleteDialog: {
    title: { en: "Are you sure?", es: "¿Estás seguro?" },
    description: { en: "This action cannot be undone. This will permanently delete the tag \"{{name}}\" and remove it from every object it's assigned to.", es: "Esta acción no se puede deshacer. Esto eliminará permanentemente la etiqueta \"{{name}}\" y la quitará de todos los objetos donde esté asignada." },
  },
  emptyState: {
    empty: { en: "No tags found", es: "No se encontraron etiquetas" },
    emptyDescription: { en: "Create your first tag to start organizing documents, templates and asset types.", es: "Creá tu primera etiqueta para empezar a organizar documentos, plantillas y tipos de activo." },
    noResults: { en: "No tags found matching your search", es: "No se encontraron etiquetas que coincidan con tu búsqueda" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load tags", es: "Error al cargar las etiquetas" },
    errorDescription: { en: "There was an error loading the data. Please try again.", es: "Hubo un error al cargar los datos. Por favor, intenta de nuevo." },
  },
}

export default translations
