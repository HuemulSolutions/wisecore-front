const translations = {
  header: {
    title: { en: "Workflow", es: "Workflow" },
    searchPlaceholder: { en: "Search by name or code...", es: "Buscar por nombre o código..." },
    documentTypePlaceholder: { en: "All document types", es: "Todos los tipos de documento" },
  },
  columns: {
    internalCode: { en: "Code", es: "Código" },
    template: { en: "Template", es: "Plantilla" },
    lifecycleState: { en: "State", es: "Estado" },
    progress: { en: "Progress", es: "Progreso" },
    currentStep: { en: "Current step", es: "Paso actual" },
    lastModified: { en: "Last modified", es: "Última modificación" },
  },
  emptyState: {
    title: { en: "No workflow items found", es: "No se encontraron elementos de workflow" },
    description: { en: "No documents in progress matching your search", es: "No hay documentos en curso que coincidan con tu búsqueda" },
  },
  panel: {
    noSelection: { en: "Select a row to view its form fields", es: "Selecciona una fila para ver los campos del formulario" },
    noCurrentStep: { en: "This item has no current step", es: "Este elemento no tiene un paso actual" },
    sectionNotFound: { en: "Section not found in the document content", es: "No se encontró la sección en el contenido del documento" },
    loadError: { en: "Failed to load the form fields", es: "Error al cargar los campos del formulario" },
    close: { en: "Close", es: "Cerrar" },
  },
  availableTemplates: {
    title: { en: "Available workflows", es: "Workflows disponibles" },
    start: { en: "Start", es: "Iniciar" },
  },
  expressSheet: {
    title: { en: "Start workflow", es: "Iniciar workflow" },
    name: { en: "Name", es: "Nombre" },
    namePlaceholder: { en: "e.g. Ergonomic chairs purchase", es: "Ej: Compra de sillas ergonómicas" },
    description: { en: "Description", es: "Descripción" },
    descriptionPlaceholder: { en: "Briefly describe this request...", es: "Describe brevemente esta solicitud..." },
    success: { en: "Document created successfully", es: "Documento creado correctamente" },
  },
}

export default translations
