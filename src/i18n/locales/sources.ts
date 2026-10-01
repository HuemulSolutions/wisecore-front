const translations = {
  // assets-sources-sheet.tsx
  sheet: {
    buttonLabel: { en: "Sources", es: "Fuentes" },
    title: { en: "Sources", es: "Fuentes" },
    description: {
      en: "Reference information used to draft this asset's content.",
      es: "Información de referencia para elaborar el contenido de este activo.",
    },
  },
  summary: {
    assets_one: { en: "{{count}} asset", es: "{{count}} activo" },
    assets_other: { en: "{{count}} assets", es: "{{count}} activos" },
    filesAndTexts_one: { en: "{{count}} file or text", es: "{{count}} archivo o texto" },
    filesAndTexts_other: { en: "{{count}} files and texts", es: "{{count}} archivos y textos" },
    pending_one: { en: "{{count}} pending", es: "{{count}} pendiente" },
    pending_other: { en: "{{count}} pending", es: "{{count}} pendientes" },
    completed: { en: "Completed", es: "Completado" },
  },
  notice: {
    externalTitle: { en: "External elaboration in progress", es: "Elaboración externa en curso" },
    externalText: {
      en: "While it lasts, sources can be viewed but not changed.",
      es: "Mientras dure, las fuentes se pueden ver pero no modificar.",
    },
    readerTitle: { en: "Reader mode", es: "Modo lectura" },
    readerText: {
      en: "To add or remove sources, switch to Editor mode.",
      es: "Para agregar o quitar fuentes pasa a modo Editor.",
    },
    readerAction: { en: "Switch to Editor", es: "Pasar a Editor" },
    readOnlyTitle: { en: "Read only", es: "Solo lectura" },
    readOnlyText: {
      en: "Your profile can view the sources but not change them.",
      es: "Tu perfil puede ver las fuentes pero no modificarlas.",
    },
  },
  add: {
    title: { en: "Add sources", es: "Agregar fuentes" },
    link: {
      title: { en: "Link asset", es: "Vincular activo" },
      subtitle: { en: "From WiseCore", es: "De WiseCore" },
      description: {
        en: "Use another WiseCore asset as a reference",
        es: "Usar otro activo de WiseCore como referencia",
      },
    },
    upload: {
      title: { en: "Upload file", es: "Subir archivo" },
      subtitle: { en: "PDF or Word", es: "PDF o Word" },
      description: {
        en: "Upload a PDF or Word document from your computer",
        es: "Subir un documento PDF o Word desde tu computador",
      },
    },
    paste: {
      title: { en: "Paste text", es: "Pegar texto" },
      subtitle: { en: "Handwritten", es: "Escrito a mano" },
      description: {
        en: "Paste or write information directly",
        es: "Pegar o escribir información directamente",
      },
    },
  },
  form: {
    createTitle: { en: "Paste text", es: "Pegar texto" },
    editTitle: { en: "Edit text", es: "Editar texto" },
    namePlaceholder: { en: "Source name", es: "Nombre de la fuente" },
    contentPlaceholder: { en: "Paste or write the text", es: "Pegar o escribir el texto" },
    required: { en: "Required", es: "Obligatorio" },
    requiredHint: {
      en: "· blocks AI generation while empty",
      es: "· bloquea la generación con IA mientras esté vacío",
    },
    cancel: { en: "Cancel", es: "Cancelar" },
    save: { en: "Save", es: "Guardar" },
    contentRequired: {
      en: "Add the text, or mark the source as required to fill it in later",
      es: "Agregar el texto, o marcar la fuente como obligatoria para completarla después",
    },
  },
  pendingAlert: {
    text_one: {
      en: "There is {{count}} required source without content. AI generation is blocked until it is completed.",
      es: "Hay {{count}} fuente obligatoria sin contenido. La generación con IA queda bloqueada hasta completarla.",
    },
    text_other: {
      en: "There are {{count}} required sources without content. AI generation is blocked until they are completed.",
      es: "Hay {{count}} fuentes obligatorias sin contenido. La generación con IA queda bloqueada hasta completarlas.",
    },
    action: { en: "Complete", es: "Completar" },
  },
  table: {
    columnSource: { en: "Source", es: "Fuente" },
    columnVersion: { en: "Version / detail", es: "Versión / detalle" },
    groups: {
      assets: {
        title: { en: "Linked assets", es: "Activos vinculados" },
        hint: { en: "AI reads their content in the chosen version", es: "La IA lee su contenido en la versión elegida" },
      },
      files: {
        title: { en: "Files", es: "Archivos" },
        hint: { en: "Documents uploaded from your computer", es: "Documentos subidos desde tu computador" },
      },
      texts: {
        title: { en: "Texts", es: "Textos" },
        hint: { en: "Information written directly", es: "Información escrita directamente" },
      },
    },
  },
  row: {
    missingMeta: {
      en: "No content · blocks AI generation",
      es: "Sin contenido · bloquea la generación con IA",
    },
    requiredMark: { en: "Required", es: "Obligatoria" },
    characters_one: { en: "{{count}} character", es: "{{count}} carácter" },
    characters_other: { en: "{{count}} characters", es: "{{count}} caracteres" },
    pastedText: { en: "Pasted text", es: "Texto pegado" },
    fileType: {
      pdf: { en: "PDF", es: "PDF" },
      word: { en: "Word", es: "Word" },
      excel: { en: "Excel", es: "Excel" },
      text: { en: "Text file", es: "Archivo de texto" },
      other: { en: "File", es: "Archivo" },
    },
    edit: { en: "Edit", es: "Editar" },
    replace: { en: "Replace", es: "Reemplazar" },
    complete: { en: "Complete", es: "Completar" },
    remove: { en: "Remove", es: "Quitar" },
  },
  version: {
    label: { en: "Version the AI uses", es: "Versión que usa la IA" },
    published: {
      title: { en: "Published version", es: "Versión publicada" },
      hint: { en: "Updates when a new one is published", es: "Se actualiza al publicar una nueva" },
      short: { en: "Published", es: "Publicada" },
    },
    latestApproved: {
      title: { en: "Latest approved", es: "Última aprobada" },
      hint: { en: "Uses the latest approved version", es: "Usa la última versión aprobada" },
      short: { en: "Latest approved", es: "Última aprobada" },
    },
    specific: {
      title: { en: "Fixed version", es: "Versión fija" },
      hint: { en: "Pin a specific version", es: "Fijar una versión específica" },
      hintNamed: { en: "Pin {{name}}", es: "Fijar {{name}}" },
      short: { en: "Fixed", es: "Fija" },
      shortNamed: { en: "Fixed {{name}}", es: "Fija {{name}}" },
    },
  },
  upload: {
    uploading: { en: "Uploading · {{percent}}%", es: "Subiendo · {{percent}}%" },
    cancel: { en: "Cancel upload", es: "Cancelar subida" },
  },
  error: {
    title: { en: "We couldn't load the sources", es: "No pudimos cargar las fuentes" },
    text: {
      en: "It may be a connection problem. Your sources are still saved; try again in a few seconds.",
      es: "Puede ser un problema de conexión. Las fuentes siguen guardadas; vuelve a intentarlo en unos segundos.",
    },
    retry: { en: "Retry", es: "Reintentar" },
  },
  empty: {
    title: { en: "This asset has no sources yet", es: "Este activo aún no tiene fuentes" },
    description: {
      en: "Sources are the material the AI consults when drafting. You can add them at any time.",
      es: "Las fuentes son el material que la IA consulta al redactar. Puedes sumarlas en cualquier momento.",
    },
    step1: { en: "Choose a source", es: "Elegir una fuente" },
    step2: { en: "Mark the required ones", es: "Marcar las obligatorias" },
    step3: { en: "Generate with AI", es: "Generar con IA" },
  },
  picker: {
    title: { en: "Link asset", es: "Vincular activo" },
    description: {
      en: "Search or browse the library to pick the asset to use as a source.",
      es: "Buscar o navegar la biblioteca para elegir el activo que se usará como fuente.",
    },
    alreadyLinked: { en: "Already a source of this asset", es: "Ya es una fuente de este activo" },
  },
  toast: {
    sourceRemoved: { en: "Source removed", es: "Fuente quitada" },
    dependencyRemoved: { en: "Dependency removed", es: "Dependencia quitada" },
    dependencyAdded: { en: "Asset linked", es: "Activo vinculado" },
    versionUpdated: { en: "Version updated", es: "Versión actualizada" },
    textAdded: { en: "Text added", es: "Texto agregado" },
    textUpdated: { en: "Text updated", es: "Texto actualizado" },
    fileAdded: { en: "File uploaded", es: "Archivo subido" },
    fileReplaced: { en: "File replaced", es: "Archivo reemplazado" },
    uploadCancelled: { en: "Upload cancelled", es: "Subida cancelada" },
    addFailed: { en: "Could not add the source", es: "No se pudo agregar la fuente" },
    updateFailed: { en: "Could not update the source", es: "No se pudo actualizar la fuente" },
    removeFailed: { en: "Could not remove the source", es: "No se pudo quitar la fuente" },
    uploadFailed: { en: "Could not upload the file", es: "No se pudo subir el archivo" },
  },
}

export default translations
