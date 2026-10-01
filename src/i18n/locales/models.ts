const translations = {
  header: {
    title: { en: "AI Models", es: "Modelos de IA" },
    subtitle: {
      en: "Choose which models your organization uses to generate text and to search your documents.",
      es: "Elige qué modelos usa tu organización para generar texto y para buscar en tus documentos.",
    },
  },
  tabs: {
    models: { en: "Language models", es: "Modelos de lenguaje" },
    embeddings: { en: "Embeddings", es: "Embeddings" },
    embeddingsConfigured: { en: "Configured", es: "Configurado" },
    embeddingsNotConfigured: { en: "Not configured", es: "Sin configurar" },
  },
  status: {
    working: { en: "Working", es: "Funcionando" },
    failing: { en: "With errors", es: "Con errores" },
    notConfigured: { en: "Not configured", es: "Sin configurar" },
    default: {
      label: { en: "Default", es: "Predeterminado" },
      description: {
        en: "Used in every AI feature that doesn't ask for a specific model.",
        es: "Se usa en todas las funciones de IA que no piden un modelo específico.",
      },
      none: { en: "None", es: "Ninguno" },
      test: { en: "Test", es: "Probar" },
      testing: { en: "Testing…", es: "Probando…" },
      connectProvider: { en: "Connect provider", es: "Conectar proveedor" },
      addModel: { en: "Add model", es: "Agregar modelo" },
    },
    search: {
      label: { en: "Document search", es: "Búsqueda en documentos" },
      description: {
        en: "Uses embeddings to find content by meaning, not just exact words.",
        es: "Usa embeddings para encontrar contenido por su significado, no solo por palabras exactas.",
      },
      off: { en: "Off", es: "Desactivada" },
      view: { en: "View", es: "Ver" },
      configure: { en: "Configure", es: "Configurar" },
      withEvaluation: { en: "{{name}} · +{{count}} in evaluation", es: "{{name}} · +{{count}} en evaluación" },
    },
    assigned: { en: "Assigned", es: "Asignado" },
    optional: { en: "Optional", es: "Opcional" },
    choose: { en: "Choose model", es: "Elegir modelo" },
    change: { en: "Change", es: "Cambiar" },
    picker: {
      requires: { en: "Requires: {{caps}}", es: "Requiere: {{caps}}" },
      search: { en: "Search models", es: "Buscar modelos" },
      noModels: {
        en: "There are no models yet. Add one to use it here.",
        es: "Todavía no hay modelos. Agrega uno para usarlo acá.",
      },
      noCompatible: {
        en: "No model has the required capabilities ({{caps}}). Enable them on a model or add a new one.",
        es: "Ningún modelo tiene las capacidades requeridas ({{caps}}). Habilítalas en un modelo o agrega uno nuevo.",
      },
      noResults: { en: "No models match your search.", es: "Ningún modelo coincide con la búsqueda." },
      incompatible: { en: "Missing capabilities", es: "Sin las capacidades requeridas" },
      addModel: { en: "Add model", es: "Agregar modelo" },
    },
    rerank: {
      label: { en: "Higher precision search", es: "Búsqueda de mayor precisión" },
      description: {
        en: "Optional. Reorders search results with this model when someone asks for higher precision. Without a model marked here, that search is not available: the default model is never used for it.",
        es: "Opcional. Reordena los resultados de la búsqueda con este modelo cuando alguien pide mayor precisión. Sin un modelo marcado acá, esa búsqueda no está disponible: nunca se usa el modelo predeterminado.",
      },
      none: { en: "No model", es: "Sin modelo" },
    },
    imageAnalysis: {
      label: { en: "Image analysis", es: "Análisis de imágenes" },
      description: {
        en: "Optional. Describes uploaded images so they can be found in searches. Without a model marked here, images are not analyzed: the default model is never used for it.",
        es: "Opcional. Describe las imágenes que se suben para poder encontrarlas en las búsquedas. Sin un modelo marcado acá, las imágenes no se analizan: nunca se usa el modelo predeterminado.",
      },
      none: { en: "No model", es: "Sin modelo" },
    },
  },
  providers: {
    title: { en: "Connected providers", es: "Proveedores conectados" },
    help: {
      en: "The accounts your models run through (OpenAI, Azure, etc.). Connect one before adding models.",
      es: "Las cuentas desde donde se usan los modelos (OpenAI, Azure, etc.). Conecta uno antes de agregar modelos.",
    },
    managed: { en: "managed", es: "gestionado" },
    modelOne: { en: "{{count}} model", es: "{{count}} modelo" },
    modelMany: { en: "{{count}} models", es: "{{count}} modelos" },
    showAll: { en: "View all ({{count}})", es: "Ver todos ({{count}})" },
    close: { en: "Close", es: "Cerrar" },
    addTitle: { en: "Connect provider", es: "Conectar proveedor" },
    addSubtitle: { en: "You need an API key", es: "Necesitas una clave API" },
  },
  table: {
    title: { en: "Available models", es: "Modelos disponibles" },
    help: {
      en: "The starred model is the default: it's used when a feature doesn't ask for a specific one.",
      es: "El modelo con la estrella es el predeterminado: se usa cuando una función no pide uno en particular.",
    },
    searchPlaceholder: { en: "Search models", es: "Buscar modelos" },
    addModel: { en: "Add model", es: "Agregar modelo" },
    columns: {
      model: { en: "Model", es: "Modelo" },
      provider: { en: "Provider", es: "Proveedor" },
      can: { en: "Can", es: "Puede" },
      price: { en: "Price / 1M tokens", es: "Precio / 1M tokens" },
    },
    default: { en: "Default", es: "Predeterminado" },
    setDefault: { en: "Set as default", es: "Establecer como predeterminado" },
    purposes: {
      menu: { en: "Use for…", es: "Usar para…" },
      rerank: { en: "Higher precision search", es: "Búsqueda de mayor precisión" },
      image_analysis: { en: "Image analysis", es: "Análisis de imágenes" },
      chipRerank: { en: "Precise search", es: "Búsqueda precisa" },
      chipImageAnalysis: { en: "Images", es: "Imágenes" },
      use: { en: "Use for {{purpose}}", es: "Usar para {{purpose}}" },
      stop: { en: "Stop using for {{purpose}}", es: "Dejar de usar para {{purpose}}" },
      missingCapability: {
        en: "This model can't be used for this: it needs {{caps}}.",
        es: "Este modelo no sirve para esto: necesita {{caps}}.",
      },
    },
    priceLegend: { en: "input · output", es: "entrada · salida" },
    noPrice: { en: "No price", es: "Sin precio" },
    noPriceHint: { en: "costs aren't estimated", es: "no se estiman costos" },
    test: { en: "Test", es: "Probar" },
    testing: { en: "Testing…", es: "Probando…" },
    testOk: { en: "Responds well", es: "Responde bien" },
    testRetry: { en: "Retry", es: "Reintentar" },
    testTitle: { en: "Check that this model responds", es: "Comprobar que este modelo responde" },
    edit: { en: "Edit model", es: "Editar modelo" },
    delete: { en: "Delete model", es: "Eliminar modelo" },
    deleteBlocked: {
      en: "Choose another default model before deleting this one",
      es: "Elige otro modelo predeterminado antes de eliminar este",
    },
    confirmDelete: { en: "Delete this model?", es: "¿Eliminar este modelo?" },
    confirmCancel: { en: "Cancel", es: "Cancelar" },
    confirmAccept: { en: "Delete", es: "Eliminar" },
    testFailed: {
      en: "The provider rejected the connection. Check the endpoint, the deployment and the key for {{provider}}",
      es: "El proveedor rechazó la conexión. Revisa el endpoint, el deployment y la clave de {{provider}}",
    },
    reviewProvider: { en: "Review provider", es: "Revisar proveedor" },
  },
  empty: {
    noProviders: {
      title: { en: "Start by connecting a provider", es: "Empieza conectando un proveedor" },
      text: {
        en: "A provider is the account (OpenAI, Azure, etc.) your models run through. You only need an API key.",
        es: "Un proveedor es la cuenta (OpenAI, Azure, etc.) desde donde se usan los modelos. Solo necesitas una clave API.",
      },
      cta: { en: "Connect provider", es: "Conectar proveedor" },
    },
    noModels: {
      title: { en: "You haven't added any models yet", es: "Todavía no agregaste modelos" },
      text: {
        en: "Add the first model to start using AI in your organization.",
        es: "Agrega el primer modelo para empezar a usar IA en tu organización.",
      },
      cta: { en: "Add model", es: "Agregar modelo" },
    },
    noResults: {
      title: { en: "No results", es: "Sin resultados" },
      text: {
        en: "No model matches your search.",
        es: "Ningún modelo coincide con la búsqueda.",
      },
      cta: { en: "Clear search", es: "Limpiar búsqueda" },
    },
  },
  capabilities: {
    text_input: {
      label: { en: "Reads text", es: "Lee texto" },
      description: { en: "Understands the text you send it", es: "Entiende el texto que se le envía" },
    },
    text_output: {
      label: { en: "Writes text", es: "Escribe texto" },
      description: { en: "Answers and generates text", es: "Responde y genera texto" },
    },
    image_input: {
      label: { en: "Reads images", es: "Lee imágenes" },
      description: { en: "Understands images and screenshots", es: "Entiende imágenes y capturas" },
    },
    image_output: {
      label: { en: "Creates images", es: "Crea imágenes" },
      description: { en: "Generates images from a description", es: "Genera imágenes a partir de una descripción" },
    },
    tool_use: {
      label: { en: "Uses tools", es: "Usa herramientas" },
      description: { en: "Can call functions and external tools", es: "Puede llamar funciones y herramientas externas" },
    },
  },
  modelSheet: {
    createTitle: { en: "Add model", es: "Agregar modelo" },
    editTitle: { en: "Edit model", es: "Editar modelo" },
    subtitle: {
      en: "A model is the specific AI that answers (for example GPT-4o). You use it through a connected provider.",
      es: "Un modelo es la IA concreta que responde (por ejemplo GPT-4o). Se usa a través de un proveedor conectado.",
    },
    providerLabel: { en: "Provider", es: "Proveedor" },
    providerHelp: {
      en: "The account this model runs through.",
      es: "La cuenta desde la que se usa este modelo.",
    },
    providerPlaceholder: { en: "Select a provider", es: "Seleccionar un proveedor" },
    noProviders: {
      en: "You need to connect a provider before adding a model.",
      es: "Necesitas conectar un proveedor antes de agregar un modelo.",
    },
    connectProvider: { en: "Connect provider", es: "Conectar proveedor" },
    displayNameLabel: { en: "Display name", es: "Nombre visible" },
    displayNameHelp: {
      en: "This is how people will see it when choosing a model.",
      es: "Así lo verán las personas al elegir un modelo.",
    },
    displayNamePlaceholder: { en: "e.g. GPT-4o", es: "ej. GPT-4o" },
    internalNameLabel: { en: "Model identifier", es: "Identificador del modelo" },
    internalNameHelp: {
      en: "The exact name the provider uses in its documentation.",
      es: "El nombre exacto que usa el proveedor en su documentación.",
    },
    internalNameHelpAzure: {
      en: "On Azure this is the name of the deployment you created in the portal.",
      es: "En Azure es el nombre del deployment que creaste en el portal.",
    },
    internalNameHelpFoundry: {
      en: "Supported values: FLUX-1.1-pro, FLUX.1-Kontext-pro, FLUX.2-pro, FLUX.2-flex. Any other value will fail.",
      es: "Valores soportados: FLUX-1.1-pro, FLUX.1-Kontext-pro, FLUX.2-pro, FLUX.2-flex. Cualquier otro valor fallará.",
    },
    internalNamePlaceholder: { en: "model-name", es: "nombre-del-modelo" },
    capabilitiesLabel: { en: "What can it do?", es: "¿Qué puede hacer?" },
    capabilitiesHelp: {
      en: "Pick everything this model supports.",
      es: "Marca todo lo que este modelo soporta.",
    },
    priceLabel: { en: "Price (optional)", es: "Precio (opcional)" },
    inputPriceLabel: { en: "Input (what you send)", es: "Entrada (lo que envías)" },
    outputPriceLabel: { en: "Output (what it answers)", es: "Salida (lo que responde)" },
    priceHelp: {
      en: "Price per million tokens, used to estimate costs. Leave empty if you don't know it.",
      es: "Precio por cada millón de tokens, para estimar costos. Déjalo vacío si no lo sabes.",
    },
    firstModelNotice: {
      en: "This is your first model: it will become the default automatically.",
      es: "Es tu primer modelo: quedará como predeterminado automáticamente.",
    },
    save: { en: "Save model", es: "Guardar modelo" },
    saveChanges: { en: "Save changes", es: "Guardar cambios" },
    errors: {
      provider: { en: "Choose a provider", es: "Elige un proveedor" },
      displayName: { en: "Enter a display name", es: "Ingresa un nombre visible" },
      internalName: { en: "Enter the model identifier", es: "Ingresa el identificador del modelo" },
      capabilities: { en: "Pick at least one capability", es: "Marca al menos una capacidad" },
      price: { en: "Enter a number of 0 or more", es: "Ingresa un número de 0 o más" },
    },
  },
  providerSheet: {
    createTitle: { en: "Connect provider", es: "Conectar proveedor" },
    editTitle: { en: "Edit provider", es: "Editar proveedor" },
    subtitle: {
      en: "A provider is the account (OpenAI, Azure, etc.) your models run through.",
      es: "Un proveedor es la cuenta (OpenAI, Azure, etc.) desde donde se usan los modelos.",
    },
    step1Title: { en: "Where do you have your account?", es: "¿Dónde tienes tu cuenta?" },
    needsKey: { en: "You only need an API key", es: "Solo necesitas una clave API" },
    needsFull: { en: "API key, endpoint and deployment", es: "Clave API, endpoint y deployment" },
    needsKeyEndpoint: { en: "API key and endpoint", es: "Clave API y endpoint" },
    change: { en: "Change", es: "Cambiar" },
    nameLabel: { en: "Connection name", es: "Nombre de la conexión" },
    nameHelp: {
      en: "So you can tell this connection apart from others.",
      es: "Para distinguir esta conexión de otras.",
    },
    namePlaceholder: { en: "e.g. Azure Production", es: "ej. Azure Producción" },
    managedNotice: {
      en: "The platform manages this provider's credentials, so there's nothing to configure here.",
      es: "La plataforma gestiona las credenciales de este proveedor, por lo que no hay nada que configurar aquí.",
    },
    apiKeyLabel: { en: "API key", es: "Clave API" },
    apiKeyHelp: {
      en: "It's stored encrypted and is never shown again.",
      es: "Se guarda cifrada y no vuelve a mostrarse.",
    },
    apiKeyHelpMultiline: {
      en: "Paste the full service account JSON, not a plain API key — Vertex AI does not support simple API key authentication.",
      es: "Pega el JSON completo de la service account, no una clave API simple — Vertex AI no admite autenticación por API key.",
    },
    apiKeySavedPlaceholder: { en: "•••••••• (saved)", es: "•••••••• (guardada)" },
    apiKeySavedHelp: {
      en: "Leave it empty to keep the current key.",
      es: "Déjala vacía para mantener la clave actual.",
    },
    whereToFind: { en: "Where do I find it?", es: "¿Dónde la encuentro?" },
    endpointLabel: { en: "Endpoint", es: "Endpoint" },
    endpointHelp: {
      en: "The address of your resource, shown in your provider's portal.",
      es: "La dirección de tu recurso, que aparece en el portal de tu proveedor.",
    },
    endpointPlaceholder: { en: "https://your-resource.openai.azure.com/", es: "https://tu-recurso.openai.azure.com/" },
    deploymentLabel: { en: "Deployment", es: "Deployment" },
    deploymentHelp: {
      en: "The name of the deployment you created in the portal.",
      es: "El nombre del deployment que creaste en el portal.",
    },
    deploymentPlaceholder: { en: "my-deployment", es: "mi-deployment" },
    usedByOne: {
      en: "1 model uses it. Delete it first to remove this provider.",
      es: "Lo usa 1 modelo. Elimínalo primero para quitar este proveedor.",
    },
    usedByMany: {
      en: "{{count}} models use it. Delete them first to remove this provider.",
      es: "Lo usan {{count}} modelos. Elimínalos primero para quitar este proveedor.",
    },
    delete: { en: "Delete provider", es: "Eliminar proveedor" },
    deleteTitle: { en: "Delete provider", es: "Eliminar proveedor" },
    deleteDescription: {
      en: "Delete the connection \"{{name}}\"? Its credentials will be removed.",
      es: "¿Eliminar la conexión \"{{name}}\"? Se quitarán sus credenciales.",
    },
    connect: { en: "Connect", es: "Conectar" },
    saveChanges: { en: "Save changes", es: "Guardar cambios" },
    errors: {
      name: { en: "Enter a name for the connection", es: "Ingresa un nombre para la conexión" },
      apiKey: { en: "Enter the API key", es: "Ingresa la clave API" },
      endpoint: { en: "Enter the endpoint", es: "Ingresa el endpoint" },
      deployment: { en: "Enter the deployment", es: "Ingresa el deployment" },
    },
  },
  embeddings: {
    intro: {
      en: "Embeddings turn the content of your documents into a numeric representation so search finds results by meaning. Search always uses one provider, the default; the other slots let you try another model with your real content before switching.",
      es: "Los embeddings convierten el contenido de tus documentos en una representación numérica para que la búsqueda encuentre resultados por significado. La búsqueda usa siempre un proveedor, el predeterminado; los otros espacios sirven para probar otro modelo con tu contenido real antes de cambiar.",
    },
    howItWorks: {
      title: { en: "How do the {{max}} slots work?", es: "¿Cómo funcionan los {{max}} espacios?" },
      whatTitle: { en: "What they're for", es: "Para qué sirven" },
      what: {
        p1: {
          en: "Search always uses one provider: the default. Everyone in the organization searches with it.",
          es: "La búsqueda usa siempre un solo proveedor: el predeterminado. Todos en la organización buscan con él.",
        },
        p2: {
          en: "The other {{evaluation}} slots are for evaluation: you add another model, it prepares itself with your real documents without touching the search people use, and you switch only when it's complete. That way you can compare models and change provider without cutting search off.",
          es: "Los otros {{evaluation}} espacios son de evaluación: agregas otro modelo, se prepara con tus documentos reales sin tocar la búsqueda que usa la gente y cambias solo cuando está completo. Así puedes comparar modelos y cambiar de proveedor sin cortar la búsqueda.",
        },
      },
      howTitle: { en: "How to use them", es: "Cómo se usan" },
      how: {
        p1: { en: "Add a provider in a free slot.", es: "Agrega un proveedor en un espacio libre." },
        p2: {
          en: "Wait for its index to be built and its vectors to be computed for all the content (progress bar).",
          es: "Espera a que se construya su índice y se calculen sus vectores para todo el contenido (barra de avance).",
        },
        p3: {
          en: "Compare it with the current one, using the search evaluations or with an admin trying searches with that provider.",
          es: "Compáralo con el actual, con las evaluaciones de búsqueda o con un administrador que pruebe búsquedas con ese proveedor.",
        },
        p4: {
          en: "When it reaches 100%, use \"Make default\". If you no longer need the previous one, delete it.",
          es: "Cuando llegue al 100 %, usa \"Hacer predeterminado\". Si ya no necesitas el anterior, elimínalo.",
        },
      },
      implicationsTitle: { en: "What it implies", es: "Implicancias" },
      implications: {
        p1: {
          en: "Cost: each provider computes vectors for all the content when added, and then for every new or edited document. With {{max}} providers, indexing costs up to {{max}} times as much, even though search uses only one.",
          es: "Costo: cada proveedor calcula vectores para todo el contenido al agregarse, y después para cada documento nuevo o modificado. Con {{max}} proveedores, indexar cuesta hasta {{max}} veces más, aunque la búsqueda use uno solo.",
        },
        p2: {
          en: "Making one the default is instant and doesn't reindex. The previous one stays as an evaluation provider and keeps being billed until you delete it.",
          es: "Hacer predeterminado a uno es instantáneo y no reindexa. El anterior queda como proveedor de evaluación y se sigue pagando hasta que lo elimines.",
        },
        p3: {
          en: "Changing a provider's model (or provider type) deletes its vectors and computes them again.",
          es: "Cambiar el modelo (o el tipo) de un proveedor borra sus vectores y los vuelve a calcular.",
        },
        p4: {
          en: "Deleting an evaluation provider deletes its vectors. Adding it back means paying for the full computation again.",
          es: "Eliminar un proveedor de evaluación borra sus vectores. Volver a agregarlo implica pagar de nuevo el cálculo completo.",
        },
        p5: {
          en: "The default can't be deleted while other providers exist: make another one the default first.",
          es: "El predeterminado no se puede eliminar mientras haya otros: primero haz predeterminado a otro.",
        },
      },
    },
    slots: {
      title: { en: "Providers ({{used}} of {{max}} slots)", es: "Proveedores ({{used}} de {{max}} espacios)" },
      defaultChip: { en: "Default · in use", es: "Predeterminado · en uso" },
      evaluationChip: { en: "Evaluation", es: "Evaluación" },
      dimensions: { en: "{{value}} dimensions", es: "{{value}} dimensiones" },
      index: {
        ready: { en: "Index ready", es: "Índice listo" },
        building: { en: "Building index", es: "Construyendo índice" },
        failed: { en: "Index failed", es: "Índice falló" },
        none: { en: "No index", es: "Sin índice" },
      },
      indexFailedHelp: {
        en: "Its index couldn't be built. Test the connection and rebuild it.",
        es: "No se pudo construir su índice. Prueba la conexión y vuelve a construirlo.",
      },
      coverageLabel: { en: "Vector coverage", es: "Cobertura de vectores" },
      coverage: {
        en: "{{done}} of {{total}} fragments with vectors ({{percent}}%)",
        es: "{{done}} de {{total}} fragmentos con vectores ({{percent}} %)",
      },
      coverageEmpty: { en: "There's no indexed content yet.", es: "Todavía no hay contenido indexado." },
      makeDefault: { en: "Make default", es: "Hacer predeterminado" },
      makeDefaultBlocked: { en: "Its index isn't ready yet.", es: "Su índice todavía no está listo." },
      test: { en: "Test", es: "Probar" },
      edit: { en: "Edit", es: "Editar" },
      rebuild: { en: "Rebuild index", es: "Reconstruir índice" },
      delete: { en: "Delete", es: "Eliminar" },
      disconnect: { en: "Disconnect", es: "Desconectar" },
      deleteDefaultBlocked: {
        en: "Make another provider the default before deleting this one.",
        es: "Haz predeterminado a otro proveedor antes de eliminar este.",
      },
      freeTitle: { en: "Free slot", es: "Espacio libre" },
      freeHelp: {
        en: "Add a provider to evaluate another model. Search keeps using the default.",
        es: "Agrega un proveedor para evaluar otro modelo. La búsqueda sigue usando el predeterminado.",
      },
      add: { en: "Add provider", es: "Agregar proveedor" },
    },
    makeDefaultDialog: {
      title: { en: "Make {{name}} the default?", es: "¿Hacer predeterminado a {{name}}?" },
      description: {
        en: "Search across the whole organization will use {{name}} right away. {{current}} stays as an evaluation provider and keeps being billed until you delete it.",
        es: "La búsqueda de toda la organización va a usar {{name}} de inmediato. {{current}} queda como proveedor de evaluación y se sigue pagando hasta que lo elimines.",
      },
      incompleteTitle: { en: "It isn't complete yet", es: "Todavía no está completo" },
      incompleteDescription: {
        en: "It has vectors for {{percent}}% of the content. If you promote it now, searching by meaning returns fewer results until it reaches 100%.",
        es: "Tiene vectores para el {{percent}} % del contenido. Si lo promueves ahora, la búsqueda por significado devuelve menos resultados hasta que llegue al 100 %.",
      },
      action: { en: "Make default", es: "Hacer predeterminado" },
      forceAction: { en: "Promote anyway", es: "Promover igual" },
    },
    deleteDialog: {
      title: { en: "Delete {{name}}?", es: "¿Eliminar {{name}}?" },
      description: {
        en: "Its vectors are deleted. If you add it again, all of them have to be computed (and paid for) again. Search isn't affected: it uses the default.",
        es: "Se borran sus vectores. Si lo vuelves a agregar, hay que calcularlos (y pagarlos) todos de nuevo. La búsqueda no se ve afectada: usa el predeterminado.",
      },
      action: { en: "Delete", es: "Eliminar" },
      disconnectTitle: { en: "Disconnect the provider?", es: "¿Desconectar el proveedor?" },
    },
    active: { en: "Active", es: "Activo" },
    indexBuilding: {
      en: "Search is being rebuilt with this provider. Until it finishes, searching by meaning may return fewer results. Refresh to see the progress.",
      es: "La búsqueda se está reconstruyendo con este proveedor. Hasta que termine, buscar por significado puede devolver menos resultados. Actualiza para ver el avance.",
    },
    indexFailed: {
      en: "Search couldn't be rebuilt with this provider. Test the connection and save the provider again to retry.",
      es: "No se pudo reconstruir la búsqueda con este proveedor. Prueba la conexión y vuelve a guardar el proveedor para reintentar.",
    },
    testIdle: { en: "Test the connection to confirm it responds", es: "Prueba la conexión para confirmar que responde" },
    testTesting: { en: "Testing…", es: "Probando…" },
    testOk: { en: "Connection verified just now", es: "Conexión verificada recién" },
    testError: { en: "The connection failed. Check the credentials.", es: "La conexión falló. Revisa las credenciales." },
    testConnection: { en: "Test connection", es: "Probar conexión" },
    editCredentials: { en: "Edit credentials", es: "Editar credenciales" },
    apiKeySaved: { en: "API key", es: "Clave API" },
    apiKeySavedValue: { en: "•••• saved", es: "•••• guardada" },
    endpoint: { en: "Endpoint", es: "Endpoint" },
    deployment: { en: "Deployment", es: "Deployment" },
    encryptedNote: {
      en: "The API key is stored encrypted and is never shown again.",
      es: "La clave API se guarda cifrada y no vuelve a mostrarse.",
    },
    disconnect: { en: "Disconnect provider", es: "Desconectar proveedor" },
    disconnectConfirm: {
      en: "When you disconnect, meaning-based search stops working until you configure another provider.",
      es: "Al desconectar, la búsqueda por significado deja de funcionar hasta que configures otro proveedor.",
    },
    disconnectCancel: { en: "Cancel", es: "Cancelar" },
    disconnectAccept: { en: "Disconnect", es: "Desconectar" },
    switchTitle: { en: "Switch provider", es: "Cambiar de proveedor" },
    useProvider: { en: "Use this provider", es: "Usar este proveedor" },
    notConfiguredBanner: {
      en: "There's no provider configured yet. Without one, meaning-based search doesn't work. Choose one to get started.",
      es: "Todavía no hay un proveedor configurado. Sin uno, la búsqueda por significado no funciona. Elige uno para empezar.",
    },
    configure: { en: "Configure", es: "Configurar" },
    descriptions: {
      openai: {
        en: "The simplest option: it only asks for an API key.",
        es: "La opción más simple: solo pide una clave API.",
      },
      azure_openai: {
        en: "To use your Azure subscription. It asks for a key, an endpoint and a deployment.",
        es: "Para usar tu suscripción de Azure. Pide clave, endpoint y deployment.",
      },
    },
  },
  embeddingSheet: {
    createTitle: { en: "Configure embeddings", es: "Configurar embeddings" },
    editTitle: { en: "Edit embeddings", es: "Editar embeddings" },
    addTitle: { en: "Add an evaluation provider", es: "Agregar proveedor de evaluación" },
    addNotice: {
      en: "When you save, it starts computing vectors for all the content (this has a cost). Search keeps using the default until you make this one the default.",
      es: "Al guardar, empieza a calcular vectores para todo el contenido (tiene costo). La búsqueda sigue usando el predeterminado hasta que hagas predeterminado a este.",
    },
    typeChangeNotice: {
      en: "Changing the provider type deletes this provider's vectors and computes them again with the new model.",
      es: "Cambiar el tipo de proveedor borra los vectores de este proveedor y los vuelve a calcular con el nuevo modelo.",
    },
    labelLabel: { en: "Name", es: "Nombre" },
    labelHelp: {
      en: "To tell providers apart (for example \"Large 3\" or \"Azure test\"). Changing only the name doesn't test the connection again.",
      es: "Para distinguir los proveedores (por ejemplo \"Large 3\" o \"Prueba Azure\"). Cambiar solo el nombre no vuelve a probar la conexión.",
    },
    labelPlaceholder: { en: "Optional", es: "Opcional" },
    subtitle: {
      en: "The provider that lets search find your content by meaning.",
      es: "El proveedor que permite que la búsqueda encuentre tu contenido por significado.",
    },
    providerLabel: { en: "Provider", es: "Proveedor" },
    replaceNotice: {
      en: "When you save, {{next}} replaces {{current}} as the active provider and every document is indexed again. Until it finishes, searching by meaning returns fewer or no results.",
      es: "Al guardar, {{next}} reemplaza a {{current}} como proveedor activo y todos los documentos se vuelven a indexar. Hasta que termine, la búsqueda por significado devuelve menos resultados o ninguno.",
    },
    apiKeyLabel: { en: "API key", es: "Clave API" },
    apiKeyHelp: {
      en: "It's stored encrypted and is never shown again.",
      es: "Se guarda cifrada y no vuelve a mostrarse.",
    },
    apiKeySavedPlaceholder: { en: "•••••••• (saved)", es: "•••••••• (guardada)" },
    apiKeySavedHelp: {
      en: "Leave it empty to keep the current key.",
      es: "Déjala vacía para mantener la clave actual.",
    },
    endpointLabel: { en: "Endpoint", es: "Endpoint" },
    endpointHelp: {
      en: "The address of your Azure resource.",
      es: "La dirección de tu recurso de Azure.",
    },
    endpointPlaceholder: { en: "https://your-resource.openai.azure.com/", es: "https://tu-recurso.openai.azure.com/" },
    deploymentLabel: { en: "Deployment", es: "Deployment" },
    deploymentHelp: {
      en: "The name of the embeddings deployment you created in Azure.",
      es: "El nombre del deployment de embeddings que creaste en Azure.",
    },
    deploymentPlaceholder: { en: "my-embeddings", es: "mis-embeddings" },
    testConnection: { en: "Test connection", es: "Probar conexión" },
    testing: { en: "Testing connection…", es: "Probando conexión…" },
    testOk: { en: "The connection works. You can save now.", es: "La conexión funciona. Ya puedes guardar." },
    testError: { en: "The connection failed. Check the credentials.", es: "La conexión falló. Revisa las credenciales." },
    testDisabled: {
      en: "Save the provider first to test the connection",
      es: "Guarda el proveedor primero para probar la conexión",
    },
    save: { en: "Save", es: "Guardar" },
    errors: {
      apiKey: { en: "Enter the API key", es: "Ingresa la clave API" },
      endpoint: { en: "Enter the endpoint", es: "Ingresa el endpoint" },
      deployment: { en: "Enter the deployment", es: "Ingresa el deployment" },
    },
  },
  toast: {
    providerConnected: { en: "Provider connected. Now add a model.", es: "Proveedor conectado. Ahora agrega un modelo." },
    providerUpdated: { en: "Provider updated", es: "Proveedor actualizado" },
    providerDeleted: { en: "Provider deleted", es: "Proveedor eliminado" },
    modelCreated: {
      en: "{{name}} added. Test the connection to confirm it responds.",
      es: "{{name}} agregado. Prueba la conexión para confirmar que responde.",
    },
    modelUpdated: { en: "Model updated", es: "Modelo actualizado" },
    modelDeleted: { en: "Model deleted", es: "Modelo eliminado" },
    defaultUpdated: { en: "{{name}} is now the default model", es: "{{name}} es ahora el modelo predeterminado" },
    purposeSet: { en: "{{name}} is now used for {{purpose}}", es: "{{name}} se usa ahora para {{purpose}}" },
    purposeCleared: {
      en: "No model is used for {{purpose}} anymore",
      es: "Ya no hay modelo para {{purpose}}",
    },
    mediaScanEnqueued: {
      en: "Images that weren't analyzed will be analyzed in the next few minutes.",
      es: "Las imágenes que no se habían analizado se van a analizar en los próximos minutos.",
    },
    embeddingConfigured: { en: "Embeddings provider configured", es: "Proveedor de embeddings configurado" },
    embeddingUpdated: { en: "Embeddings provider updated", es: "Proveedor de embeddings actualizado" },
    embeddingUpdatedReindex: {
      en: "Embeddings provider updated. The model changed, so search is being rebuilt.",
      es: "Proveedor de embeddings actualizado. Cambió el modelo, así que la búsqueda se está reconstruyendo.",
    },
    embeddingProviderAdded: {
      en: "Provider added. It's computing its vectors in the background.",
      es: "Proveedor agregado. Está calculando sus vectores en segundo plano.",
    },
    embeddingDefaultChanged: { en: "{{name}} is now the default provider", es: "{{name}} es ahora el proveedor predeterminado" },
    embeddingProviderDeleted: { en: "Embedding provider deleted", es: "Proveedor de embeddings eliminado" },
    embeddingIndexQueued: {
      en: "Index rebuild queued. Refresh in a few minutes to see the progress.",
      es: "Reconstrucción del índice en cola. Actualiza en unos minutos para ver el avance.",
    },
    embeddingDeleted: { en: "Embeddings provider disconnected", es: "Proveedor de embeddings desconectado" },
  },
  errors: {
    failedToLoadProviders: { en: "Failed to load providers", es: "Error al cargar proveedores" },
    failedToLoadModels: { en: "Failed to load models", es: "Error al cargar modelos" },
    failedToLoadEmbeddings: { en: "Failed to load embeddings provider", es: "Error al cargar el proveedor de embeddings" },
    errorLoadingData: { en: "There was an error loading the data. Please try again.", es: "Hubo un error al cargar los datos. Reintentar." },
    missingCapability: {
      en: "This model doesn't have the capabilities this use needs. Edit its capabilities or choose another model.",
      es: "Este modelo no tiene las capacidades que necesita este uso. Edita sus capacidades o elige otro modelo.",
    },
    purposeRequiresCapability: {
      en: "This model is used for higher precision search or image analysis, and that needs the capability you removed. Assign another model to that use first.",
      es: "Este modelo se usa para la búsqueda de mayor precisión o el análisis de imágenes, y eso necesita la capacidad que quitaste. Asigna primero otro modelo a ese uso.",
    },
    capabilityLockedByPurpose: {
      en: "Required because this model is used for {{purpose}}.",
      es: "Obligatoria porque este modelo se usa para {{purpose}}.",
    },
  },
}

export default translations
