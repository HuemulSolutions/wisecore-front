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
    viewObjects: { en: "View objects", es: "Ver objetos" },
    viewTemplates: { en: "View templates", es: "Ver plantillas" },
    viewAssetTypes: { en: "View asset types", es: "Ver tipos de activo" },
    viewDocuments: { en: "View documents", es: "Ver documentos" },
  },
  mutations: {
    createSuccess: { en: "Tag created successfully", es: "Etiqueta creada correctamente" },
    updateSuccess: { en: "Tag updated successfully", es: "Etiqueta actualizada correctamente" },
    deleteSuccess: { en: "Tag deleted successfully", es: "Etiqueta eliminada correctamente" },
  },
  assign: {
    assignedLabel: { en: "Assigned tags", es: "Etiquetas asignadas" },
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
  picker: {
    addTag: { en: "Add tag", es: "Añadir etiqueta" },
    searchPlaceholder: { en: "Search or create...", es: "Buscar o crear..." },
    noResults: { en: "No tags found", es: "No se encontraron etiquetas" },
    noResultsCannotCreate: { en: "No matching tags. This picker only lists existing tags.", es: "Sin etiquetas coincidentes. Este selector solo lista etiquetas existentes." },
    createAndAssign: { en: "Create \"{{name}}\" and assign", es: "Crear \"{{name}}\" y asignar" },
    duplicateName: { en: "A tag with that name already exists.", es: "Ya existe una etiqueta con ese nombre." },
    selectExisting: { en: "Select the existing tag from the list above.", es: "Seleccioná la etiqueta existente de la lista de arriba." },
    applyingTo: { en: "Applying to {{count}} objects", es: "Aplicando a {{count}} objetos" },
    partialHint: { en: "\"–\" means only some of the selected objects have this tag.", es: "\"–\" significa que solo algunos de los objetos seleccionados tienen esta etiqueta." },
    allLabel: { en: "all", es: "todas" },
    partialLabel: { en: "partial", es: "parcial" },
    keyboardHint: { en: "↑↓ navigate · Enter toggle · Esc close", es: "↑↓ navegar · Enter alternar · Esc cerrar" },
    manageTags: { en: "Manage tags", es: "Administrar etiquetas" },
    removeTag: { en: "Remove {{name}}", es: "Quitar {{name}}" },
    moreCount: { en: "+{{count}}", es: "+{{count}}" },
    empty: { en: "No tags assigned", es: "Sin etiquetas asignadas" },
    loading: { en: "Loading...", es: "Cargando..." },
  },
}

export default translations
