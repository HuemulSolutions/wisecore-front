const translations = {
  header: {
    title: { en: "My Subscriptions", es: "Mis Suscripciones" },
    description: {
      en: "Documents and executions you are watching or have marked as favorite.",
      es: "Documentos y versiones que estás siguiendo o marcaste como favorito.",
    },
    addItem: { en: "Add Subscription", es: "Agregar Suscripción" },
  },
  emptyState: {
    title: { en: "No subscriptions yet", es: "Sin suscripciones aún" },
    description: {
      en: "You are not watching any document or execution.",
      es: "No estás siguiendo ningún documento o versión.",
    },
  },
  errorState: {
    failedToLoad: { en: "Failed to load subscriptions", es: "Error al cargar las suscripciones" },
    errorDescription: {
      en: "An error occurred while loading your subscriptions. Please try again.",
      es: "Ocurrió un error al cargar tus suscripciones. Por favor, inténtalo de nuevo.",
    },
  },
  columns: {
    document: { en: "Document", es: "Documento" },
    reactionType: { en: "Reaction", es: "Reacción" },
    eventType: { en: "Event", es: "Evento" },
    notifications: { en: "Notify", es: "Notificar" },
    daysBefore: { en: "Days Before", es: "Días Antes" },
  },
  reactionType: {
    watch: { en: "Watch", es: "Seguir" },
    favorite: { en: "Favorite", es: "Favorito" },
    love: { en: "Love", es: "Me encanta" },
    insights: { en: "Insights", es: "Insights" },
  },
  eventType: {
    execution_expiration_date: { en: "Expiration Date", es: "Fecha de Expiración" },
    execution_audit_date: { en: "Audit Date", es: "Fecha de Auditoría" },
    execution_estimated_publication_date: { en: "Est. Publication Date", es: "Fecha Est. de Publicación" },
    execution_review_date: { en: "Review Date", es: "Fecha de Revisión" },
    document_new_comments: { en: "New Comments", es: "Nuevos Comentarios" },
    document_stage_draft: { en: "Stage: Draft", es: "Estado: Borrador" },
    document_stage_in_review: { en: "Stage: In Review", es: "Estado: En Revisión" },
    document_stage_in_approval: { en: "Stage: In Approval", es: "Estado: En Aprobación" },
    document_stage_approved: { en: "Stage: Approved", es: "Estado: Aprobado" },
    document_stage_published: { en: "Stage: Published", es: "Estado: Publicado" },
    document_stage_archived: { en: "Stage: Archived", es: "Estado: Archivado" },
  },
  labels: {
    document: { en: "Document", es: "Documento" },
    execution: { en: "Version", es: "Versión" },
    event: { en: "Event", es: "Evento" },
    email: { en: "Email", es: "Email" },
    inApp: { en: "In-App", es: "En App" },
    noEvent: { en: "—", es: "—" },
  },
  form: {
    documentPlaceholder: { en: "Search document...", es: "Buscar documento..." },
    reactionTypePlaceholder: { en: "Select reaction type", es: "Seleccionar tipo de reacción" },
    eventTypePlaceholder: { en: "Select event type (optional)", es: "Seleccionar tipo de evento (opcional)" },
    daysBefore: { en: "Days Before", es: "Días Antes" },
    daysBeforePlaceholder: { en: "e.g. 7", es: "ej. 7" },
    comment: { en: "Comment", es: "Comentario" },
    commentPlaceholder: { en: "Optional comment...", es: "Comentario opcional..." },
    notifyEmail: { en: "Notify by Email", es: "Notificar por Email" },
    notifyInApp: { en: "Notify In-App", es: "Notificar en App" },
    requireReadAck: { en: "Require Read Acknowledgement", es: "Requerir Confirmación de Lectura" },
  },
  create: {
    title: { en: "Add Subscription", es: "Agregar Suscripción" },
    submitLabel: { en: "Add", es: "Agregar" },
    success: { en: "Subscription added successfully", es: "Suscripción agregada correctamente" },
  },
  edit: {
    title: { en: "Edit Subscription", es: "Editar Suscripción" },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: { en: "Subscription updated successfully", es: "Suscripción actualizada correctamente" },
  },
  delete: {
    title: { en: "Delete Subscription", es: "Eliminar Suscripción" },
    description: {
      en: "Are you sure you want to delete this subscription for \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar esta suscripción para \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    confirmLabel: { en: "Delete", es: "Eliminar" },
  },
  actions: {
    edit: { en: "Edit", es: "Editar" },
    delete: { en: "Delete", es: "Eliminar" },
  },
}

export default translations
