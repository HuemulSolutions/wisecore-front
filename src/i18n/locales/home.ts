const translations = {
  hero: {
    title: { en: "Welcome to Wisecore", es: "Bienvenido a Wisecore" },
    description: {
      en: "Wisecore is an advanced platform powered by Large Language Models (LLMs) designed to help organizations generate, manage, and share internal knowledge efficiently. Centralize your company's information, automate documentation, and empower your teams with instant access to reliable, AI-driven insights.",
      es: "Wisecore es una plataforma avanzada impulsada por Modelos de Lenguaje de Gran Escala (LLMs) diseñada para ayudar a las organizaciones a generar, gestionar y compartir conocimiento interno de manera eficiente. Centraliza la información de tu empresa, automatiza la documentación y empodera a tus equipos con acceso instantáneo a perspectivas confiables basadas en IA.",
    },
  },

  features: {
    automatedDocs: {
      title: { en: "Automated Documentation", es: "Documentación Automatizada" },
      description: {
        en: "Generate and organize internal documentation automatically.",
        es: "Genera y organiza documentación interna automáticamente.",
      },
    },
    intelligentSearch: {
      title: { en: "Intelligent Search", es: "Búsqueda Inteligente" },
      description: {
        en: "Quickly search within your organization's knowledge and assets.",
        es: "Busca rápidamente en el conocimiento y activos de tu organización.",
      },
    },
    teamCollaboration: {
      title: { en: "Team Collaboration", es: "Colaboración en Equipo" },
      description: {
        en: "Collaborate and share information across teams.",
        es: "Colabora y comparte información entre equipos.",
      },
    },
    aiInsights: {
      title: { en: "AI Insights", es: "Perspectivas de IA" },
      description: {
        en: "Leverage AI to answer questions and surface key insights.",
        es: "Aprovecha la IA para responder preguntas y obtener perspectivas clave.",
      },
    },
  },

  fieldShowcase: {
    title: { en: "HuemulField showcase", es: "Demo de HuemulField" },
    fullName: {
      label: { en: "Full name", es: "Nombre completo" },
      placeholder: { en: "John Doe", es: "Juan García" },
      helpText: { en: "Enter your first and last name.", es: "Ingresa tu nombre y apellido." },
    },
    email: {
      label: { en: "Email", es: "Correo electrónico" },
      placeholder: { en: "you@example.com", es: "tu@ejemplo.com" },
    },
    role: {
      label: { en: "Role", es: "Rol" },
      placeholder: { en: "Select a role", es: "Seleccionar un rol" },
      admin: { en: "Admin", es: "Administrador" },
      editor: { en: "Editor", es: "Editor" },
      viewer: { en: "Viewer", es: "Visualizador" },
    },
    plan: {
      label: { en: "Plan", es: "Plan" },
      placeholder: { en: "Search plans...", es: "Buscar planes..." },
      free: { en: "Free", es: "Gratis" },
      freeDesc: { en: "Up to 5 users", es: "Hasta 5 usuarios" },
      pro: { en: "Pro", es: "Pro" },
      proDesc: { en: "Up to 50 users", es: "Hasta 50 usuarios" },
      enterprise: { en: "Enterprise", es: "Empresa" },
      enterpriseDesc: { en: "Unlimited users", es: "Usuarios ilimitados" },
    },
    startDate: {
      label: { en: "Start date", es: "Fecha de inicio" },
    },
    uploadFile: {
      label: { en: "Upload a file", es: "Subir un archivo" },
      description: { en: "Select a file from your computer.", es: "Selecciona un archivo de tu computadora." },
    },
    brandColor: {
      label: { en: "Brand color", es: "Color de marca" },
    },
    notes: {
      label: { en: "Notes", es: "Notas" },
      placeholder: { en: "Add a note...", es: "Agregar una nota..." },
    },
    emailNotifications: {
      label: { en: "Email notifications", es: "Notificaciones por correo" },
      checkLabel: { en: "Receive email updates", es: "Recibir actualizaciones por correo" },
    },
    searchScope: {
      label: { en: "Search scope", es: "Ámbito de búsqueda" },
      all: { en: "All", es: "Todos" },
      myOrg: { en: "My org", es: "Mi organización" },
      mine: { en: "Mine", es: "Mío" },
    },
    richText: {
      label: { en: "Rich text content", es: "Contenido de texto enriquecido" },
      description: { en: "Full rich-text editor powered by Plate.", es: "Editor de texto enriquecido completo impulsado por Plate." },
    },
  },

  sheetShowcase: {
    title: { en: "HuemulSheet showcase", es: "Demo de HuemulSheet" },
    saveLabel: { en: "Save", es: "Guardar" },
    confirmLabel: { en: "Confirm", es: "Confirmar" },
    applyLabel: { en: "Apply", es: "Aplicar" },
    downloadLabel: { en: "Download", es: "Descargar" },
    approveLabel: { en: "Approve", es: "Aprobar" },
    requestChangesLabel: { en: "Request changes", es: "Solicitar cambios" },
    rejectLabel: { en: "Reject", es: "Rechazar" },
    saveChangesLabel: { en: "Save changes", es: "Guardar cambios" },

    basic: {
      button: { en: "Basic", es: "Básico" },
      buttonDesc: { en: "Save + Cancel footer", es: "Pie con Guardar + Cancelar" },
      title: { en: "Basic Sheet", es: "Panel Básico" },
      body1: {
        en: "This is the most common configuration: a title, body content, a primary Save button and a Cancel button in the sticky footer.",
        es: "Esta es la configuración más común: un título, contenido, un botón principal Guardar y un botón Cancelar en el pie fijo.",
      },
      body2: {
        en: "The save action is async — it shows a spinner until the promise resolves, then auto-closes the sheet after a short delay.",
        es: "La acción de guardado es asíncrona: muestra un indicador hasta que la promesa se resuelve y luego cierra el panel automáticamente.",
      },
    },

    iconDesc: {
      button: { en: "Icon + Description", es: "Ícono + Descripción" },
      buttonDesc: { en: "Header icon & subtitle", es: "Ícono y subtítulo en cabecera" },
      title: { en: "Edit Profile", es: "Editar Perfil" },
      description: {
        en: "Update your personal information. Changes are saved immediately.",
        es: "Actualiza tu información personal. Los cambios se guardan de inmediato.",
      },
      note: {
        en: "The header renders an icon to the left of the title and an optional description line below it.",
        es: "La cabecera muestra un ícono a la izquierda del título y una línea de descripción opcional debajo.",
      },
      note2: {
        en: "Pass any LucideIcon via icon and customise its colour with iconClassName.",
        es: "Pasa cualquier LucideIcon mediante icon y personaliza su color con iconClassName.",
      },
    },

    loading: {
      button: { en: "Body Loading", es: "Cargando Cuerpo" },
      buttonDesc: { en: "Skeleton while fetching", es: "Esqueleto mientras carga" },
      title: { en: "Loading Content", es: "Cargando Contenido" },
      description: {
        en: "Simulates a sheet that is fetching remote data.",
        es: "Simula un panel que está obteniendo datos remotos.",
      },
    },

    headerActions: {
      button: { en: "Header Actions", es: "Acciones en Cabecera" },
      buttonDesc: { en: "Buttons in the header", es: "Botones en la cabecera" },
      title: { en: "Asset Settings", es: "Configuración del Activo" },
      description: {
        en: "Actions can be placed in the header for quick access.",
        es: "Las acciones pueden colocarse en la cabecera para acceso rápido.",
      },
      note: {
        en: "Both Save and Download are rendered inside the header by setting position: \"header\".",
        es: "Tanto Guardar como Descargar se muestran en la cabecera configurando position: \"header\".",
      },
      note2: {
        en: "The footer is hidden via showFooter=false since all actions are already in the header.",
        es: "El pie se oculta con showFooter=false ya que todas las acciones están en la cabecera.",
      },
    },

    extraFooter: {
      button: { en: "Extra Footer Actions", es: "Acciones Extra en Pie" },
      buttonDesc: { en: "Multiple footer buttons", es: "Múltiples botones en el pie" },
      title: { en: "Review Asset", es: "Revisar Activo" },
      description: {
        en: "Multiple footer actions with different intents.",
        es: "Múltiples acciones en el pie con diferentes intenciones.",
      },
      note: {
        en: "Use extraActions to render additional buttons alongside the primary save action. Each can have its own variant, icon and async handler.",
        es: "Usa extraActions para renderizar botones adicionales junto a la acción principal. Cada uno puede tener su propio variant, ícono y manejador asíncrono.",
      },
      item1: {
        en: "Approve — primary default button, auto-closes on success.",
        es: "Aprobar — botón principal predeterminado, se cierra automáticamente al éxito.",
      },
      item2: {
        en: "Request changes — secondary, stays open after resolving.",
        es: "Solicitar cambios — secundario, permanece abierto al resolver.",
      },
      item3: {
        en: "Reject — destructive variant, auto-closes on success.",
        es: "Rechazar — variante destructiva, se cierra automáticamente al éxito.",
      },
    },

    leftSide: {
      button: { en: "Left Side", es: "Lado Izquierdo" },
      buttonDesc: { en: "Slides from the left", es: "Se desliza desde la izquierda" },
      title: { en: "Left Panel", es: "Panel Izquierdo" },
      description: {
        en: "Sheet entering from the left edge of the screen.",
        es: "Panel que entra desde el borde izquierdo de la pantalla.",
      },
      note: {
        en: "Set side=\"left\" to slide in from the opposite edge — useful for navigation panels or contextual filters.",
        es: "Establece side=\"left\" para deslizar desde el borde opuesto — útil para paneles de navegación o filtros contextuales.",
      },
    },

    bottomSide: {
      button: { en: "Bottom Side", es: "Lado Inferior" },
      buttonDesc: { en: "Slides from the bottom", es: "Se desliza desde abajo" },
      title: { en: "Bottom Sheet", es: "Panel Inferior" },
      description: {
        en: "Sheet entering from the bottom — great for mobile experiences.",
        es: "Panel que entra desde abajo — ideal para experiencias móviles.",
      },
      note: {
        en: "Set side=\"bottom\" for a bottom sheet. Combine with maxWidth=\"sm:max-w-full\" so it spans the full width.",
        es: "Establece side=\"bottom\" para un panel inferior. Combina con maxWidth=\"sm:max-w-full\" para que ocupe el ancho completo.",
      },
    },

    noFooter: {
      button: { en: "No Footer", es: "Sin Pie" },
      buttonDesc: { en: "Content-only, no sticky bar", es: "Solo contenido, sin barra fija" },
      title: { en: "Read-only Details", es: "Detalles de Solo Lectura" },
      description: {
        en: "Informational panel — no actions required.",
        es: "Panel informativo — no se requieren acciones.",
      },
      note: {
        en: "Set showFooter=false to hide the entire sticky footer area — ideal for read-only detail views.",
        es: "Establece showFooter=false para ocultar el área del pie fijo — ideal para vistas de solo lectura.",
      },
      note2: {
        en: "The user can still dismiss the sheet via the default close button (✕) in the top-right corner provided by Radix.",
        es: "El usuario puede cerrar el panel mediante el botón de cierre predeterminado (✕) en la esquina superior derecha proporcionado por Radix.",
      },
    },

    wide: {
      button: { en: "Wide Sheet", es: "Panel Amplio" },
      buttonDesc: { en: "Custom max-width", es: "Ancho máximo personalizado" },
      title: { en: "Wide Sheet", es: "Panel Amplio" },
      description: {
        en: "Expanded width for data-heavy content like tables or forms.",
        es: "Ancho expandido para contenido con muchos datos como tablas o formularios.",
      },
      note: {
        en: "Override the default width (sm:max-w-md) with the maxWidth prop. Any Tailwind max-width class works — e.g. sm:max-w-2xl, sm:max-w-4xl, etc.",
        es: "Sobrescribe el ancho predeterminado (sm:max-w-md) con la prop maxWidth. Cualquier clase Tailwind de ancho máximo funciona, como sm:max-w-2xl, sm:max-w-4xl, etc.",
      },
    },
  },
}

export default translations
