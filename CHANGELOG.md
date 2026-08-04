# Changelog

## [1.0.82] - 2026-08-03
### Nuevo
- mostrar y generar resumen de IA del contenido en gestión de versiones
- agregar endpoints de token-usage (stats, listado paginado, detalle)
- agregar mensaje de bienvenida al pedir nombre de asset en workflow express
- rediseñar resumen de secciones de workflow y mover respuestas a un sheet
- mostrar indicador "desde plantilla" en custom fields de documento
- agregar botones de ciclo de vida al panel de formularios de workflow
- rediseñar header y grid de workflows disponibles en página workflow
- agregar filtros avanzados al listado de workflows (GET /workflows/)
- agregar panel de consulta de respuestas anteriores en wizard de workflow
- agregar botón para crear diagrama desde sheet de diagramas del asset
- agregar sheet de edición rápida de nombre/código/descripción en workflow
- marcar seccion form como respondida al salir de edicion y mostrar estado en workflow
- separar picker de mention en modos Asset y Versión
- permitir mencionar version especifica de un asset en el editor
- avisar que los cambios se guardan automaticamente al editar seccion form
### Arreglos
- corregir errores de tipos en wizard de workflow (currentSection undefined y SectionStats)
- quitar toast de autoguardado que tapaba botón Siguiente del wizard
- quitar barra de progreso
- quitar contadores de obligatorias pendientes y respondidas del resumen de secciones
- quitar manualChunks que rompia React en produccion
- corregir chunking de react-vendor que rompia el build de produccion
- revelar contenido de sección apenas termina en ejecución "desde sección"
- mostrar nombre de activo antes que tipo de activo en sheets de creación
- Error en build
- mostrar franja de color del document type en cards de workflows disponibles
- mostrar descripción (máx 3 líneas) en cards de workflows disponibles
- paginar client-side grid de workflows disponibles para forzar 2 filas
- ensanchar buscador del header en página workflow
- refrescar listado de workflows al cerrar panel y mostrar nombre del asset en tabla
- enviar solo template_id o execution_id en edit_with_ai, nunca ambos
- cambiar dialog de edición de asset a sheet lateral
- mostrar preview correcto de archivos no-imagen en formularios
- separar NavKnowledgeProvider del contexto para evitar duplicado por Fast Refresh
- guardar respuestas de formulario al perder foco en vez de debounce por tecla
- mostrar version_major.minor.patch en selector de versión del asset picker
- eliminar nombre de persona incorrecto en footer de secciones tipo formulario
- mejorar UX de carga inicial con splash, skeletons y code-splitting por ruta
- refrescar tambien templates al usar boton refresh en workflow
### Otros
- Quitar variable sin uso
- Autocomplete de campo tipo email
- Mejorar diagramas desde asset y en su propio menu
- Fix. onRefresh solo invalida, refetch automatico dispara. Sin llamadas duplicadas.

## [1.0.81] - 2026-07-28
### Arreglos
- no propagar a ejecuciones secciones tipo ai/reference
### Otros
- Separa ChatbotProvider del contexto para evitar duplicado por Fast Refresh
- Toast clickeable sobre dialogs y sheets modales. Mostrar detalle de los errores
- Sugerencia de version y configuracion para cumplimiento de versionamiento ISO
- Ajuste de z index de contenedor y texto
- Solucion error
- Ajuste error de refresco al cambiar de org
- Ajuste explorador de archivo: Frontend muestra como devuelve el listado el backend

## [1.0.80] - 2026-07-26
### Otros
- error dependencias
- solucion error
- Permitir que se agregue un contenedor y un texto en los diagramas
- Pagina de workflow con creacion de template express
- Jerarquia jefes permisos lifecycle
- Ajustes de autoguardado y validacion de campos
- Historial de cambios de seccion formulario y entre versiones
- Implementar endpoint para templates para crear express
- Merge pull request #163 from HuemulSolutions/fix/platejs-media-redos-cve
- Ajustes boton para editar con ia
- Cambios para solucionar build
- Ajuste para secciones de tipo form
- Pagina workflows
- Mostrar diagramas dentro de un asset
- Agregar sheet que me permita ver el historial de ciclo de vida de una ejecucion
- Agregar como referencia otros documentos con @
- Ajuste autoguardado de formularios
- Copiar label y valor de los formularios
- Nuevo formato para custom fields

## [1.0.79] - 2026-07-21
### Otros
- Visualizacion de diagramas y relaciones
- Texto generado por llm para cambios de version al aprobar cuando se asigno una version
- Ajustes al importar un asset
- Ejecutar siempre sistema externo al avanzar de paso
- Subscripcion a notificacion por email diaria
- Ajuste medias url y diagramas
- Ajustes ciclo de vida
- Crear carpetas grupales en root
- Mejora pagina de sistema externo
- Archivar version y poder restaurarla
- Al guardar un diagrama se puede enlazar a cualquier asset
- Modo manual o automatico en pasos del ciclo de vida para elaboracion y revision
- Enlace de template con asset type
- Lista desplegable multiple
- Ocultar autocompletado nativo en campos
- Filtro por custom field y valor de custom field
- Ajustes exportacion e importacion archivo portable
- Dependencia de campos

## [1.0.78] - 2026-07-14
### Otros
- Nuevo estilo home
- Agregar estadisticas home
- eliminar codigo muerto
- eliminar hover de boton para agregar seccion entre otras
- Refresco de version al editar los formularios
- bugfix: Al renderizar imagenes priorizaba el preview url antes de la url
- Cambiar de dialog a sheet
- Ajuste permisos
- Permisos para relaciones

## [1.0.77] - 2026-07-09
### Otros
- Implementar Lifecycle External Review
- Agregar endpoints de lifecycle external review
- Ajuste custom field en asset y template
- Nuevo formato de custom fields
- Mover dialog a sheet y ajustar formulario
- Crear asset desde canvas
- Mostrar informacion del sistema externo en paso de publicacion
- Implementacion de nuevos tipos de carpeta y permisos por rol
- Mover boton de ejecutar publicacion externa a dropdown de mas opciones
- Agregar boton para refrescar logs
- Agregar mas informacion de logs de una funcionalidad
- Publicar con sistema externo activo por defecto
- Ajustar la visualizacion de json en los campos del formulario de funcionalidad
- Fijar en la primera fila asset type creado
- Edicion con ia en secciones
- Exportacion de assets, templates y roles
- Ajustes pagina de asset type
- Mejora visualizacion versiones media
- Editar creador de asset
- Ajustes de huemul combobox y ajustar como se crea una pregunta tipo de campo personalizado
- Diagramas de version asset
- Comparacion de versiones de un asset
- Ajustar vista de instrucciones y vista de formulario

## [1.0.76] - 2026-07-01
### Nuevo
- Ajustes campos para formulario
- Custom fields filter
- Implementar tipo de seccion formulario en template y asset
- Publicacion Externa
- Importar y exportar asset type en diferentes ambientes
- Ajuste endpoints
- Tipo de seccion formulario
- Cambiar de dialog a sheet al crear y editar
- Mejorar componente reutilizable y mostrar instrucciones en contenido de asset
- Mejora arbol
- Cambiar dialog de secciones a sheet
### Otros
- Nueva version y ajustes tablas

## [1.0.75] - 2026-06-22
### Nuevo
- Crear componente reutilizable y implementarlo para mostrar instrucciones
- Permitir ajustar columnas y mostrar filtros cerrados
- Cambio de vista media y filtros
- Pasar de async-select a async-combobox
### Otros
- solucion errores

## [1.0.74] - 2026-06-21
### Nuevo
- Relacion assets
- Mejora distribucion campos al crear e importar
- Ajustar diseño de filtros home y agregar componente reutilizable.
- Implementar instrucciones en template
- Convertir de dialog a sheet al editar secciones
- Implementar paginaciones en notificaciones y subscripciones
- Agregar listado de notificaciones
- Ajustar logica de carga de arbol de assets
- mostrar dialog al mover un nodo para seleccionar version
- Nuevo datatype form y nuevo section type form
- Expandir carpetas si se refresca y hay un asset abierto
- Control de cambios sin guardar y ajuste plate editor
- agregar clase de estilo condicional en el editor y crear archivo de exportación para diálogos de suscripciones
- agregar hoja de suscripciones y traducción para "Mis Suscripciones"
- agregar filtros para la obtención de contenido de biblioteca y mejorar la estructura de tipos
- agregar diálogos para crear, editar y eliminar suscripciones, y añadir traducciones para la gestión de suscripciones
- ajustar clases de estilo en AssetContent y SectionExecution para mejorar la presentación en modo de edición
- agregar soporte para el nuevo variante "code" en HuemulInfoItem y actualizar tipos correspondientes
- agregar soporte para ID de organización en las propiedades del editor de placas
- agregar traducciones y módulo para gestión de media
- agregar selector de referencia de medios y contexto para su gestión
- agregar botón de referencia de medios en la barra de herramientas del editor
- agregar efecto para reiniciar la versión seleccionada al cambiar el activo
- agregar página de medios y enlace en el menú de configuración
- eliminar fondo y padding del contenedor de modo y opciones en AssetContent
- agregar selección de versiones para alertas de fechas en notificaciones
- add notifications feature with subscriptions management
- mejorar la lógica de manejo de clics para clonar plantillas
- agregar funcionalidad para clonar plantillas y mejorar la traducción de textos en componentes de plantillas
- mejorar la presentación y funcionalidad de los botones en AssetContent, VersionSelectorDropdown y ViewModeToggle
- enhance document type relationships and execution handling
- agregar gestión de permisos de activos y actualizar traducciones

## [1.0.73] - 2026-06-08
### Nuevo
- actualizar la versión a 1.0.73 en package.json
- simplificar la obtención de ID y nombre en RelationshipDeleteDialog y manejar acciones opcionales en RelationshipEdge
- agregar soporte para búsqueda avanzada en ejecuciones y tipos de documento
- add execution relationships management to document type relationships canvas
- agregar panel de relaciones de tipos de activo y funcionalidad para ver relaciones en el ciclo de vida de activos
- agregar funcionalidad de actualización y refresco en el panel de relaciones de tipos de documento
- implementar panel de concesión de permisos en el ciclo de vida de activos y agregar manejo de actualizaciones de permisos
- add More Options Dropdown, Version Selector, and View Mode Toggle components

## [1.0.72] - 2026-06-02
### Nuevo
- actualizar versión a 1.0.72 en package.json
- mejorar estilos de texto y tipografía en varios componentes
- agregar función para editar proveedor de modelo y actualizar interfaz de diálogo de edición de relaciones
- agregar manejo de actualización de relaciones en el canvas y propagar cambios al diálogo de edición
- simplificar la obtención del proveedor por defecto y mejorar la gestión del nombre del proveedor en la tabla de modelos
- agregar soporte para búsqueda al presionar Enter en campos de selección asíncrona
- agregar LlmConfigBanner y hooks para gestionar el estado de configuración del LLM

## [1.0.71] - 2026-05-29
### Nuevo
- actualizar la versión a 1.0.71 en package.json
- restringir tipos de archivos de imagen permitidos a PNG, JPG, JPEG, GIF y BMP en varios diálogos de carga
- mejorar la gestión de eventos en el componente HuemulTable al simplificar la función onClick
- corregir traducción de "Cambiar Default" a "Cambiar Predeterminado" en modelos

## [1.0.70] - 2026-05-29
### Nuevo
- actualizar la versión a 1.0.70 en package.json
- mejorar el diseño de la sección de modelos con ajustes en el espaciado y clases responsivas
- agregar soporte para la carga de imágenes desde el portapapeles y mejorar la gestión de URLs de vista previa en los nodos de imagen
- agregar manejo de estado de carga para el modelo LLM por defecto en los componentes Chatbot y Wisy Panel
- enhance HuemulTable with loading states and row class customization
- agregar manejo de estado de fallo en la sección de ejecución y traducciones correspondientes
- agregar soporte para serialización y deserialización de nodos de imagen con tokens {{MEDIA:GUID}} en MarkdownKit

## [1.0.69] - 2026-05-28
### Nuevo
- actualizar versión a 1.0.69 y agregar dependencia @xyflow/react
- agregar búsqueda de tipos de documento en el componente Home y optimizar la función getDocumentTypes
- agregar soporte para parámetros SAML2 y actualizar tipos de autenticación
- agregar traducciones para SAML2 y relaciones de tipos de documento en los módulos de i18n
- agregar soporte para documentTypeId en useDocumentTypeRelationships y optimizar useDocumentTypes
- agregar debounce en el campo de búsqueda de AsyncSelectField y hacer opcional la etiqueta en HuemulFieldProps
- agregar tipo de cambio 'run_ai' en SectionHistoryChangeType
- add document type relationships canvas and related components
- agregar soporte para parámetros SAML2 en los diálogos de creación y edición de tipos de autenticación
- agregar componentes para la gestión de tipos de documentos en el sidebar y nodos
- agregar ruta para la gestión de relaciones de tipos de documentos y funcionalidad de copia en el visor de diferencias
- agregar hooks y servicios para la gestión de relaciones de tipos de documentos
- agregar funcionalidad de gestión de lienzos con diálogos de creación, edición y eliminación
### Otros
- Refactor types

## [1.0.68] - 2026-05-22
### Nuevo
- agregar función toDateParam para formatear fechas en parámetros de búsqueda
- agregar nuevos filtros y opciones de búsqueda en el componente de búsqueda
- add date range selection to HuemulField component and enhance table sorting functionality
- add new TypeScript interfaces for roles, permissions, search, sections, templates, and document handling
- agregar manejo de selección manual en AsyncSelectField
- agregar historial de cambios y soporte para ver cambios en secciones
### Otros
- actualizar versión a 1.0.68 en package.json
- refactor: eliminar importaciones innecesarias de tipos en componentes de roles y secciones

## [1.0.67] - 2026-05-20
### Nuevo
- agregar página de demostración de HuemulLayout y soporte de paginación en Templates
- agregar paginación al componente de contenido de activos
- agregar componente de paginación y refactorizar el manejo de paginación en HuemulTable
- agregar soporte para paginación en el contexto de NavKnowledge
- integrar soporte para tipos de activos y mejorar la gestión de contenido en la biblioteca
- actualizar etiquetas y descripciones para incluir acciones dinámicas en la configuración del ciclo de vida
- mejorar estilos en ScrollArea y HuemulFileTree para mejor visualización y comportamiento
### Otros
- actualizar versión a 1.0.67 en package.json
- refactor: eliminar soporte de paginación en TemplatesSidebar y limpiar código relacionado
- refactor(i18n): streamline translations by removing unused keys and consolidating common phrases

## [1.0.66] - 2026-05-19
### Nuevo
- actualizar versión a 1.0.66 en package.json
- agregar soporte para auto-scroll durante operaciones de arrastre en HuemulFileTree
- agregar opción "Mover al Raíz" y actualizar mensajes de éxito para mover carpetas y documentos
- actualizar interfaz DeleteFolderDialogProps para incluir opción de eliminar documentos y agregar className en PageHeaderProps
- agregar opción para eliminar documentos en la función deleteFolder
- agregar ScrollArea en AssetsContent y mejorar estilos en SearchPage
- mejorar estilos y clases en componentes HuemulPageHeader, HuemulPageLayout y HuemulTable
- agregar opción para eliminar documentos al eliminar una carpeta y redirigir si se eliminan documentos
- actualizar traducciones para el diálogo de eliminación de carpeta y agregar opción para eliminar documentos
- agregar opción para eliminar documentos en el diálogo de eliminación de carpeta

## [1.0.65] - 2026-05-17
### Nuevo
- agregar funcionalidad para clonar tipo de activo y estado de clonación en AssetTypePage
- agregar funcionalidad para clonar tipo de activo en AssetTypesPage y mejorar filtros en Home
- agregar traducciones para el componente HuemulFilters y clonar tipo de activo
- agregar componente HuemulFilters para panel de filtros colapsable
- agregar funcionalidad para clonar tipos de activos
- reemplazar contenedor de filtros por componente HuemulFilters y agregar soporte para abrir por defecto
- agregar funcionalidad para probar la conexión del proveedor con un botón de carga
- agregar funcionalidad para clonar tipos de activos y actualizar la tabla de acciones
- sincronizar el estado de revisión con los datos del servidor al actualizar el contenido
- agregar traducciones para secciones y detalles de plantillas en español e inglés
- agregar componente HuemulInfoDisplay para mostrar información estructurada
- agregar componente TemplateInfoSheet para mostrar información detallada de plantillas
- agregar componente AssetsInfoSheet para mostrar información detallada de activos
- agregar opciones de personalización en FileTree y mejorar la gestión de dependencias
- agregar funcionalidad para renombrar y eliminar conversaciones en el panel de chat
- agregar funcionalidad de plantillas DOCX con opciones de carga y gestión
- add Word export functionality with template selection and file upload
- agregar funciones para manejar plantillas DOCX y exportar ejecuciones personalizadas
- agregar columna de comentarios no resueltos en la tabla de ejecuciones y actualizar tipos de ejecución
- agregar función para formatear fechas como fechas absolutas con configuración regional
- agregar nuevas traducciones y columnas para fechas en la tabla de ejecuciones
### Arreglos
- actualizar versión a 1.0.65 en package.json
- actualizar el ícono de la aplicación a la imagen de favicon de Wisecore
- corregir la verificación de acceso para la exportación a Word en la configuración de exportación combinada
- corregir la sintaxis del manejador de clic en el componente TemplateDocxList

## [1.0.64] - 2026-05-06
### Nuevo
- actualizar la versión a 1.0.64 en package.json
- integrar el panel global en los componentes de contenido y ajustar el tamaño del panel en función de su estado

## [1.0.63] - 2026-05-05
### Nuevo
- actualizar la versión a 1.0.63 en package.json
- permitir el uso de propietario "todos" o "personalizado" en el paso de vista
- agregar traducciones para tiempo relativo y mejorar la gestión de ejecuciones en la página de inicio
- mejorar la función formatRelativeTime para usar traducciones y optimizar la salida de tiempo relativo
- agregar hook useAllExecutions y servicio getAllExecutions para gestionar ejecuciones
- agregar indicador de carga por nodo en HuemulFileTree y mejorar la gestión de estado en Assets
- mejorar la gestión de arrastre en HuemulFileTree para permitir copiar y mover nodos
- agregar gestión de contexto de trabajo en el chatbot y soporte para traducciones
- agregar contexto de panel global y componente WisyToggle para mejorar la interfaz de usuario
- agregar propiedad assetName al componente ExecutionInfoSheet para mejorar la integración con el contexto del documento
- agregar contexto de trabajo y chips de contexto al panel de chatbot feat: implementar manejo de arrastre y caída para agregar contexto de trabajo feat: agregar traducciones y mejorar la visualización en el componente de chatbot refactor: optimizar la estructura del componente WisyPanel y sus interacciones
- agregar nombre de activo al componente AssetContent para mejorar la visualización

## [1.0.62] - 2026-04-28
### Nuevo
- eliminar páginas de configuración y ejecución para simplificar la estructura del proyecto
### Otros
- actualizar versión a 1.0.62 en package.json
- refactor: integrate HuemulPageLayout into various pages for consistent layout structure

## [1.0.61] - 2026-04-28
### Nuevo
- agregar formulario de exportación a Excel y lógica para manejar la exportación masiva de datos
- agregar opción de "todos" en filtros de búsqueda y mejorar lógica de selección en AsyncSelectField
- actualizar lógica de estado en EditStepContent para manejar tipos de acceso y permisos de propietario
- agregar soporte para noOwner y useAllOrCustomOwner en CreateStepContent y actualizar lógica en StepContent
### Otros
- actualizar versión a 1.0.61 en package.json
- refactor: eliminar parámetro stepType en EditStepCard para simplificar la interfaz

## [1.0.60] - 2026-04-25
### Nuevo
- agregar componente AssetEmptyContent y optimizar lógica de renderizado en AssetsContent
- optimizar gestión de callbacks en FileTree y prevenir cargas concurrentes en HuemulFileTree
- agregar extracción de ID de medios desde URL de Azure Blob y mejorar gestión de medios en ImageElement
### Otros
- actualizar versión a 1.0.60 en package.json
- refactor: eliminar lógica de depuración en useUserPermissions para simplificar el código
- refactor: reorganizar la interfaz MediaVersion y Media para mejorar la claridad y consistencia de los tipos
- refactor: eliminar función de extracción de ID de medios y simplificar la lógica de resolución de mediaId en ImageElement

## [1.0.59] - 2026-04-24
### Nuevo
- actualizar traducciones y mejorar la gestión de funcionalidades externas
- implementar gestión de carga de archivos en el editor y actualizar la API de medios
- agregar gestión de medios con consultas y mutaciones
- agregar gestión de permisos para sistemas externos y funcionalidades
- agregar soporte para roles de propietario y personalizados en la gestión de accesos
- add external systems management components
- agregar hooks para la gestión de funcionalidades, parámetros, secretos y sistemas externos
- agregar traducciones para sistemas externos, funcionalidades, secretos y parámetros
- actualizar traducciones para funcionalidades externas en la página de sistemas externos
- agregar página de sistemas externos y enlaces de navegación
- agregar servicios para la gestión de funcionalidades, parámetros y secretos externos
- agregar tipos y interfaces para funcionalidades externas, parámetros, secretos y sistemas
- agregar interfaces HuemulTreeNode y HuemulTreeMenuAction para la gestión de árboles
- add JSON editor field and file tree component
- agregar funcionalidad de gestión de versiones y botón de refresco en el componente AssetContent
- agregar traducciones para guardar fechas de negocio y seleccionar fecha
- agregar función para actualizar fechas comerciales de ejecución
- agregar hoja de gestión de versiones con funcionalidad de edición y selección
- traducir el texto del placeholder en el campo de entrada de fecha
- agregar rutas protegidas y mejorar la gestión de secciones en el panel de historial de cambios
- agregar filtros de búsqueda y optimizar la lógica de búsqueda en la página de búsqueda
- optimizar consultas de plantillas y secciones en el formulario de ejecución masiva
- agregar botón de actualización en el panel de historial de cambios
- agregar mensajes de éxito para las mutaciones de discusión y comentarios
- agregar soporte para selección de capacidades en el diálogo del modelo
### Arreglos
- actualizar la versión a 1.0.59 en package.json
- eliminar importación innecesaria de DiscussionKit en el editor de placas
- corregir la función de consulta para obtener tipos de activos

## [1.0.57] - 2026-04-20
### Nuevo
- agregar soporte para elementos de dibujo de código y su integración en el editor
- agregar soporte para capacidades de modelos, incluyendo diálogo y gestión de estado
- refactor TableOfContents to use useCallback for active section updates and improve scroll handling
- agregar soporte para sugerencias de IA, incluyendo manejo de estado y visualización de cambios sugeridos
- agregar soporte para copiar enlaces a secciones y mejorar la navegación entre secciones
- agregar panel de historial de cambios y soporte para sugerencias AI pendientes
- integrar withRefresh en mutaciones y mejorar la gestión de sugerencias AI en la tabla de contenidos

## [1.0.56] - 2026-04-16
### Nuevo
- actualizar la versión a 1.0.56 en package.json
- reemplazar componente Select por HuemulField en la sección de ejecución y agregar soporte para tamaño de selección "xs"
- agregar sección de inicio y mejorar la navegación en la página avanzada con resultados de ejecución
- mejorar la lógica de rutas protegidas y manejo de permisos para soportar enlaces profundos y selección de organización
- agregar funciones de navegación para abrir activos y versiones en el panel de selección de activos
- mejorar la función sanitizeNodes para validar la jerarquía de tablas y asegurar que los nodos tengan un array iterable de `children`
- agregar función sanitizeNodes para asegurar que los nodos tengan un array iterable de `children` y evitar fallos en Slate
- actualizar capacidades de LLM a 'text_input' y ajustar la función de actualización del modelo
- agregar protección de permisos a la ruta "advanced" y actualizar la lógica de navegación en AppLayout
### Otros
- eliminar importación no utilizada de Bot en mass-execution-form.tsx

## [1.0.55] - 2026-04-15
### Nuevo
- implementar página "Advanced" con selección de activos y ejecución masiva; agregar funciones para generación y corrección masiva en servicios
- agregar traducciones para la página "Advanced" y actualizar estado de revisión en locales
- agregar página "Advanced" y ruta correspondiente en App; mejorar componente Checkbox para manejar estado indeterminado; añadir propiedad resizable en HuemulPageLayout
- agregar elemento de navegación "Advanced" con icono Zap en AppLayout y AppSidebar
- agregar panel de selección de activos y formulario de ejecución masiva
- agregar manejo de estado de revisión en SectionExecution y selector para cambiar el estado
- agregar traducciones para la barra de herramientas del editor y registrar el módulo en i18n
- mejorar manejo de envío en HuemulDialog y reemplazar PlateRichEditor por SectionPlateEditor en HuemulField
- mejorar construcción de URL para incluir ID de ejecución y ajustar manejo de búsqueda en la navegación
- agregar soporte para traducciones en los botones de la barra de herramientas del editor
- reemplazar PlateRichEditor por SectionPlateEditor en el formulario de secciones
- agregar soporte para traducciones en la barra de herramientas del editor y mejorar la interfaz del editor de secciones
- mejorar manejo de IDs en encabezados para evitar duplicados y ajustar offset en la barra de herramientas
- agregar manejo de importación de documentos con opción de forzar importación y manejo de errores duplicados
- importar función handleApiError para manejo de errores en la página de ejecución
### Otros
- actualizar versión a 1.0.55 en package.json

## [1.0.54] - 2026-04-09
### Nuevo
- agregar archivo .nvmrc y actualizar versión en package.json
- agregar manejo de sugerencias de IA en la ejecución de secciones
- agregar manejo de mensajes de éxito en mutaciones utilizando meta en lugar de toast
- reemplazar mensajes de error en exportaciones con manejo de errores centralizado
- agregar componente AiSuggestionFeedback para manejar el estado de sugerencias de IA
- agregar componente MarkdownDiffViewer para mostrar diferencias entre strings markdown
- agregar manejo de mensajes de éxito en mutaciones utilizando toast
- agregar traducciones para sugerencias de IA y mensajes de estado en los archivos de localización
- eliminar el uso de toast y agregar mensajes de éxito en las mutaciones de varios hooks
- eliminar el uso de toast y agregar mensajes de éxito en las mutaciones de plantillas
- agregar mensajes de éxito en las mutaciones y optimizar el manejo de sugerencias AI

## [1.0.53] - 2026-04-07
### Nuevo
- actualizar versión a 1.0.53 en package.json
- eliminar manejo de permisos en la tabla de tipos de activos
- eliminar la restricción de versión de Node.js en package.json
- agregar manejo de permisos en la tabla de tipos de activos
- eliminar baseUrl de la configuración de TypeScript en tsconfig.app.json y tsconfig.json

## [1.0.52] - 2026-04-07
### Nuevo
- actualizar versión a 1.0.52 y agregar soporte para Node.js >=22.0.0
- eliminar manejo de permisos en la tabla de tipos de activos y agregar exportación a Excel en el contenido de activos
- agregar manejo de errores en el editor y soporte para ID de ejecución de sección en la sincronización de discusiones
- agregar búsqueda en la selección de permisos y mejorar la gestión de búsqueda en el formulario de edición de roles
- mejorar gestión de permisos para crear comentarios y discusiones en los componentes de discusión y barra de herramientas
- agregar traducción para exportar como Excel en los activos
- mejorar gestión de discusiones y permisos de acceso en los hooks
- agregar función para crear discusión con comentario y mejorar la paginación de discusiones
- agregar campos de discusión y comentarios, y mejorar la estructura de tipos en las interfaces de discusión
- agregar botón para crear nueva versión en el menú desplegable de ejecución y mejorar la gestión de fragmentos en el editor
- mejorar la sincronización de discusiones y auto-guardar cambios en el editor
- agregar enlace para obtener credenciales en los campos de API Key, Endpoint y Deployment
- agregar soporte para la inicialización del editor desde contenido Plate JSON y auto-guardar cambios en discusiones
- agregar soporte para el componente LifecycleRollbackDialog y mejorar la gestión de etiquetas de ejecución
- agregar componente LifecycleRollbackDialog para gestionar retrocesos de ejecución
- agregar soporte para opciones agrupadas en el componente HuemulField
- agregar traducciones para la funcionalidad de reversión y credenciales en los activos
- agregar soporte para objetivos de reversión y mejorar la función de rechazo del ciclo de vida de ejecución
- agregar propiedades opcionales para URLs de documentación y credenciales en SupportedProvider
- simplificar el diálogo de adición de contexto y agregar soporte para carga de archivos
- agregar traducciones y mejorar la interfaz de usuario en la sección de ejecución

## [1.0.51] - 2026-03-31
### Nuevo
- agregar funcionalidad de búsqueda y paginación en la asignación de roles y usuarios
- agregar diálogo de comentarios para confirmar acciones en el ciclo de vida de los activos
- agregar funcionalidad para crear secciones a partir de texto seleccionado en la barra de herramientas flotante
- agregar lógica para habilitar/deshabilitar la opción de eliminación en EditStepCard
- agregar lógica para ocultar la opción "todos" en función del tipo de paso en EditStepCard
- agregar funcionalidad para renombrar versiones de ejecución y dialogo correspondiente
- eliminar el formulario de registro y ajustar la lógica de autenticación a solo inicio de sesión
### Arreglos
- actualizar la versión a 1.0.51 en package.json

## [1.0.50] - 2026-03-28
### Nuevo
- actualizar la versión a 1.0.50 en package.json
- implementar un guardia de edición para manejar cambios no guardados y mejorar la experiencia del usuario
- mejorar el manejo de errores utilizando handleApiError en varios componentes
- mejorar el manejo de errores al utilizar handleApiError para mostrar descripciones y notificaciones
- implementar sincronización de discusiones y comentarios con la API en el editor
- ajustar el desplazamiento al hacer clic en los encabezados en la tabla de contenido para mejorar la experiencia de navegación
- agregar contexto SectionIndex para generar IDs de encabezados en la navegación del contenido
- mejorar el componente EditStepCard con nuevos botones de guardar y cancelar durante la edición
- agregar soporte de paginación en la lista de plantillas y mejorar la gestión del ciclo de vida de documentos y ejecuciones
- agregar soporte para permisos de ciclo de vida en HuemulButton y mejorar el componente HuemulDialog con manejo de envío por tecla Enter
### Otros
- refactor: actualizar traducciones para reemplazar "documento" por "activo" en múltiples archivos de localización
- Refactor translations to replace "document" with "asset" across multiple locales for consistency and clarity. Updated phrases in common, context, custom fields, dependencies, execute, home, layout, organizations, search, and sections files to reflect the change in terminology.

## [1.0.49] - 2026-03-26
### Nuevo
- mejorar gestión de permisos de acceso y optimizar la obtención de tipos de documentos
- agregar soporte de paginación en varios componentes de la interfaz
- agregar soporte de traducción a varios componentes y mensajes de error
- add i18n support to asset dialogs and forms
### Otros
- actualizar versión a 1.0.49 en package.json

## [1.0.48] - 2026-03-22
### Nuevo
- agregar funcionalidad para clonar roles, incluyendo diálogo y traducciones
- eliminar propiedades innecesarias de RolesTable y UserPageHeader
- agregar soporte de búsqueda en múltiples servicios, incluyendo asset types, auth types, custom fields, folders, organizations, roles, templates y users
- agregar traducciones para los placeholders de búsqueda y mensajes de no resultados en español e inglés
- refactor CustomFieldPageState, enhance DataTable with loading states, and implement HuemulPageLayout and HuemulTable components
- agregar soporte de búsqueda en hooks de asset, auth, custom fields, roles y users
- enhance search functionality across components and update table implementations
- Actualizar interfaces para incluir nuevos campos en AssetTypePageState, PaginationParams, DataTableProps y PageHeaderSearchConfig
- Reemplazar HuemulDialog por HuemulSheet en el componente AssetTypeLifecycleDialog
- Añadir función para importar documentos desde un archivo
- Añadir soporte para traducciones en las páginas Home, Organizations, Search y Users
- Mejorar componentes Huemul con soporte para nuevos tipos y gestión de permisos
- Añadir estado 'import_failed' al control de finalización en useExecutionPolling y mejorar la gestión de errores en useLifecycleMutations
- Refactor user management dialogs and forms to use Huemul components and i18n for translations
- Añadir soporte para traducciones en el componente DataTable
- Integrar HuemulButton y HuemulDialog en componentes de plantillas, añadiendo soporte para traducciones
- Reemplazar componente Button por HuemulButton y ajustar diálogos en SortableSection y SortableSectionSheet
- Reemplazar componentes Button por HuemulButton y ajustar diálogos en secciones
- Integrar HuemulButton y soporte para traducciones en componentes de búsqueda
- Reemplazar componente Button por HuemulButton en AssignRolesSheet
- Exportar tipo PlateRichEditorRef desde PlateRichEditor
- Agregar método getValue a PlateRichEditor y manejar cambios de contenido en SectionPlateEditor
- Integrar soporte para traducciones en componentes de navegación y gestión de activos
- Mejorar la lógica de confirmación en el diálogo de eliminación de organizaciones
- Ajustar lógica de finalización en el banner de estado de ejecución y mejorar el manejo de secciones en la retroalimentación de ejecución
- Integrar Huemul UI en diálogos de dependencia y agregar soporte para traducciones
- Integrar traducciones y mejorar componentes de contexto en el diálogo de adición y edición
### Otros
- actualizar versión a 1.0.48 en package.json
- Refactor pages to integrate table loading state management and improve search functionality
- Merge pull request #87 from HuemulSolutions/DevSilva-Wisecore-2026
- Add translations for various application sections and functionalities
- Organizartion files changes
- Refactor custom fields components to use Huemul UI components and integrate i18n for translations
- refactor: replace ReusableDialog with HuemulDialog in asset dialogs and update translations
- Merge pull request #86 from HuemulSolutions/mati

## [1.0.47] - 2026-03-18
### Nuevo
- persist chatbot across navigation and org changes

## [1.0.46] - 2026-03-18
### Nuevo
- enviar contexto del chatbot por mensaje
### Otros
- update version to 1.0.46
- merge: integrar cambios de mati en mati-chat y actualizar versión a 1.0.46
- merge: incorporar cambios recientes de mati

## [1.0.45] - 2026-03-18
### Otros
- ignore local tasks directory

## [1.0.44] - 2026-03-17
### Nuevo
- Ajustar lógica para seleccionar el primer tipo de paso al abrir el diálogo
- Actualizar versión a 1.0.43 en package.json
- Agregar gestión de permisos de ciclo de vida y modos de visualización/edición en el componente AssetContent
- Agregar traducciones para select y búsqueda en el componente común, y actualizar estilos secundarios en CSS
- Mejorar la lógica de redirección tras autenticación, manejando URL de retorno desde sessionStorage
- Agregar campos de entrada de fecha y radio al componente HuemulField, incluyendo traducciones y mejoras en la gestión de estados
- Implement lifecycle management for asset types with associated hooks and translations
- Persist intended URL for redirection after login and enhance permissions refresh logic
- Implement asset type lifecycle management dialog and edit step functionality
- agregar traducciones para mensajes de error y éxito en las páginas de autenticación, modelos y roles
- eliminar archivos de traducción en inglés y español para componentes de administración, modelos, organizaciones y usuarios
- agregar traducciones para tipos de autenticación, administración global, organizaciones, usuarios, modelos y roles
- integrate i18next for internationalization in roles components
- unificar claves de traducción comunes en diálogos y acciones de proveedores
- actualizar claves de traducción comunes en componentes de acciones y diálogos
- unificar claves de traducción en componentes de administración global
- actualizar claves de traducción en componentes de proveedor de embedding
- integrar soporte de traducción y mejorar componentes de autenticación
### Otros
- update version to 1.0.44
- merge: integrar cambios de dev en mati y actualizar versión a 1.0.44
- Merge pull request #85 from HuemulSolutions/DevSilva-Wisecore-2026

## [1.0.43] - 2026-03-11
### Nuevo
- mejorar estilos y funcionalidad en componentes de la interfaz de usuario
- mejorar la disposición del componente HuemulField para un mejor manejo de etiquetas y controles
- add translation support for models section
- agregar tipos y interfaces para proveedores de LLM y sus solicitudes de creación
- agregar funciones para editar contextos de texto y archivo; implementar servicio LLM y actualizar orden de secciones
- add color picker to home page and enhance models page with provider management features
- agregar soporte para internacionalización con archivos de traducción en inglés y español
- add HuemulField component with various input types and validation features
- agregar diálogos para la gestión de proveedores LLM
- agregar componentes para la gestión de modelos de IA
- agregar secciones de administración de organizaciones y usuarios
- actualizar importación del tipo LLM desde '@/types/llm'
- agregar componentes EmbeddingProviderCard y EmbeddingProviderEditDialog
- actualizar importación de PageHeader para usar el componente de Huemul
- agregar diálogos para agregar, editar y eliminar contextos en la gestión de documentos
- agregar importación del módulo de i18n para soporte de internacionalización
- actualizar importación de PageHeader para usar el componente de Huemul
- refactor componentes para usar Huemul y agregar opción de crear versión inicial en el diálogo de creación de activos
### Arreglos
- add missing Plate drag and drop dependencies
- actualizar la importación del componente PageHeader en RolesSearch y UserPageHeader; agregar notificación de sesión expirada en AuthProvider
- actualizar la importación del componente PageHeader en OrganizationPageHeader
### Otros
- Merge pull request #84 from HuemulSolutions/DevSilva-Wisecore-2026
- errores deploy
- Merge pull request #83 from HuemulSolutions/DevSilva-Wisecore-2026
- refactor: remove models components and related files
- Merge pull request #82 from HuemulSolutions/DevSilva-Wisecore-2026
- Merge pull request #81 from HuemulSolutions/DevSilva-Wisecore-2026
- Merge pull request #80 from HuemulSolutions/DevSilva-Wisecore-2026
- Merge pull request #79 from HuemulSolutions/DevSilva-Wisecore-2026
- Merge pull request #78 from HuemulSolutions/DevSilva-Wisecore-2026

## [1.0.42] - 2026-03-05
### Nuevo
- actualizar versión a 1.0.42 y agregar dependencias de i18next y react-i18next
- actualizar tipos de SelectedFilesOrErrors a string en la gestión de archivos seleccionados
- agregar tipos de SelectedFilesOrErrors en la gestión de archivos seleccionados
- mejorar la gestión de archivos seleccionados en los componentes de medios
- add SectionPlateEditor component for unified section editing and viewing
- agregar tipos de lodash como dependencia de desarrollo

## [1.0.41] - 2026-03-03
### Nuevo
- actualizar versión a 1.0.41 y agregar la dependencia remark-math
- add table toolbar button and related components
- agregar soporte para ocultar la barra de desplazamiento y definir nuevos colores de marca y resaltado en index.css
- actualizar dependencias y agregar nuevas bibliotecas en package.json
- agregar la biblioteca de íconos y registrar la URL de Plate en el archivo de configuración de componentes
- agregar preprocesamiento de sintaxis de resaltado en el componente Markdown y mejorar la vista previa en la sección de resultados de búsqueda
- agregar lógica para manejar la selección de organización en el inicio de sesión
- agregar diálogos de edición y eliminación de plantillas en el sidebar de plantillas
- refactor manejo de diálogos de creación y eliminación de activos para mejorar la experiencia de usuario
- actualizar la descripción del diálogo de creación de activos
- agregar opción para marcar campo como requerido en modo contenido
- mejorar la carga de contenido en el componente AssetContent y actualizar el tamaño del panel en la página de activos
- mejorar el manejo de errores en varios componentes utilizando handleApiError
- agregar opción para mostrar detalles de error en las notificaciones de toast
- actualizar la gestión de navegación de documentos y mejorar la presentación de secciones
- mejorar la gestión de selección de organización al evitar parpadeos en el diálogo
- mejorar el manejo de errores al eliminar secciones en varios componentes
- agregar soporte para el elemento <mark> en el componente Markdown
- mejorar la gestión de navegación y selección de organización con estados de carga
- eliminar componente HighlightedMarkdown y su lógica asociada
- eliminar el proveedor de organización del árbol de componentes
- agregar animación de entrada para elementos de navegación
- simplificar redirección en RootRedirect y eliminar lógica de organización

## [1.0.40] - 2026-02-23
### Nuevo
- actualizar la versión a 1.0.40 en package.json
- mejorar la protección de rutas para la página de administración global y ajustar redirecciones
- agregar paginación y total de usuarios en la respuesta de la API de usuarios globales
- agregar soporte para resaltar el nodo activo en el árbol de archivos basado en la URL
- actualizar rutas de navegación para usar '/asset' en lugar de '/document' y eliminar la página de documento
- agregar soporte para editar contenido y configuración de plantillas de campos personalizados
- mejorar manejo de errores en la búsqueda con mensajes detallados y opción de reintento
- implementar navegación basada en organización y redirección de rutas
- agregar botón para ir a la administración global y mejorar manejo de tokens en httpClient
- refactor organization handling to use UserOrganization type and improve member visibility in dialogs
### Otros
- Merge pull request #75 from HuemulSolutions/mati
- Merge pull request #74 from HuemulSolutions/mati
- Merge pull request #73 from HuemulSolutions/DevSilva_2026

## [1.0.39] - 2026-02-17
### Nuevo
- actualizar la versión a 1.0.39 en package.json
- mejorar la visualización de contenido en secciones con Markdown y ajustar la presentación de información de referencia
- implementar generación de token mediante mutación y simplificar manejo de estado en la selección de organización
- mejorar el manejo del diálogo de edición de campos personalizados según el modo
- ordenar ejecuciones por fecha de creación en orden descendente y actualizar texto de botón
- agregar modo de edición para campos personalizados y mejorar el manejo de contenido
- agregar propiedad output en secciones y mejorar el manejo de entradas manuales
- agregar soporte para execution_id en la creación de secciones
- actualizar textos a inglés en la hoja de secciones y mejorar el manejo del diálogo de eliminación
- agregar sincronización de documentos y plantillas entre secciones
- agregar soporte para vincular secciones a ejecuciones y mejorar la gestión de eliminación de secciones
- mejorar la creación de secciones de ejecución y agregar soporte para nuevas propiedades en la solicitud
- agregar soporte para proveedores de embeddings y mejorar la gestión de secciones de documentos
- agregar soporte para encabezado X-Org-Id en las solicitudes de administración de organizaciones
- agregar manejo de administración de organizaciones y mejorar la gestión de errores en formularios de autenticación
- agregar manejo de errores de contenido y mejorar la lógica de prueba de conexión en modelos
- implement global admin settings page with organization and user management
- actualizar lógica de filtrado y agregar color a los tipos de documentos en los permisos de rol
- Actualizar la URL de la API en el Dockerfile para incluir la versión
- Reemplazar Dockerfile.och con Dockerfile.orch para construcción y despliegue del frontend
- Agregar configuración de Docker para construcción y despliegue del frontend en DEV
- Actualizar el README.md con información detallada sobre Wisecore Frontend y su arquitectura
- Actualizar el flujo de trabajo de DockerHub para usar Dockerfile.orch
- Añadir flujo de trabajo para construir y subir la imagen del frontend a DockerHub
### Arreglos
- Corregir la etiqueta de la imagen Docker en el flujo de trabajo de DockerHub
- Corregir la ruta del archivo Dockerfile en el flujo de trabajo de DockerHub
### Otros
- Merge pull request #72 from HuemulSolutions/mati
- Merge pull request #71 from HuemulSolutions/mati
- Merge pull request #70 from HuemulSolutions/mati
- Merge pull request #69 from HuemulSolutions/mati
- Merge pull request #68 from HuemulSolutions/mati
- Refactor permissions handling and update asset-related permissions
- Refactor API error handling and remove redundant error checks
- Merge pull request #67 from HuemulSolutions/mati
- Merge pull request #66 from HuemulSolutions/mati
- Merge pull request #64 from HuemulSolutions/mati
- Refactor asset permissions and resource references
- Merge pull request #62 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #61 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #60 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #59 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #58 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #57 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #56 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #55 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #54 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #52 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #51 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #50 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #49 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #47 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #46 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #45 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #44 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #42 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #41 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #40 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #39 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #38 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #37 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #36 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #35 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #34 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #32 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #31 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #30 from HuemulSolutions/DevSilva_11_2025
- Update dev_web-hs-wisecore-frontend-qa-1.yml
- Add or update the Azure App Service build and deployment workflow config
- Merge pull request #29 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #28 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #27 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #25 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #23 from HuemulSolutions/DevSilva_11_2025
- Merge branch 'main' into dev
- Merge pull request #21 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #19 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #18 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #17 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #16 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #15 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #14 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #13 from HuemulSolutions/DevSilva_11_2025
- Merge pull request #10 from HuemulSolutions/dev
- Merge branch 'main' of https://github.com/HuemulSolutions/wisecore-front
- Create NOTICE.md
- Create LICENSE.md
- Update README.md
- Merge pull request #9 from HuemulSolutions/dev
- Merge pull request #7 from HuemulSolutions/dev
- Merge pull request #6 from HuemulSolutions/dev
- Merge pull request #5 from HuemulSolutions/dev
- Update main_web-hs-wisecore-prod-1.yml
- Add or update the Azure App Service build and deployment workflow config
- Merge pull request #3 from HuemulSolutions/dev
- Update azure-static-web-apps-purple-meadow-00bcdff0f.yml VITE_API_URL
- Update azure-static-web-apps-purple-meadow-00bcdff0f.yml
- Update vite.config.ts increse chunksize
- Delete .github/workflows/azure-static-web-apps-agreeable-cliff-0097d3a0f.yml
- ci: add Azure Static Web Apps workflow file on-behalf-of: @Azure opensource@microsoft.com
- Merge pull request #2 from HuemulSolutions/dev
- Update azure-static-web-apps-agreeable-cliff-0097d3a0f.yml
- Update azure-static-web-apps-agreeable-cliff-0097d3a0f.yml
- ci: add Azure Static Web Apps workflow file on-behalf-of: @Azure opensource@microsoft.com
- Merge pull request #1 from HuemulSolutions/dev-2

## [1.0.38] - 2026-01-22
### Nuevo
- actualizar lógica de paginación y respuesta en componentes de plantillas de campos personalizados
- actualizar mensajes y permisos en los componentes AssetContent, ExecuteSheet y SectionExecution

## [1.0.37] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.37 en package.json
- mejorar mensajes y deshabilitar botones durante la ejecución en SectionExecution
- agregar propiedad accessLevels a los componentes AssetContent y ExecuteSheet

## [1.0.36] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.36 en package.json
- comentar DocumentActionButton en SectionExecution para ajustes en permisos

## [1.0.35] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.35 en package.json
- comentar DocumentAccessControl en AssetContent y SectionExecution para ajustes en permisos
- agregar propiedad access_levels a selectedFile en ExecuteSheetProps

## [1.0.34] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.34 en package.json
- actualizar DocumentActionButton para requerir acceso de nivel de documento y permisos globales en ExecuteSheet y TemplateConfigSheet
- agregar verificación de permisos globales en AssetContent

## [1.0.33] - 2026-01-22
### Nuevo
- actualizar permisos de acceso en DocumentActionButton para incluir edición
- actualizar permisos de acceso en DocumentActionButton para permitir edición
- permitir ejecución de secciones AI y null, actualizar permisos de acceso en DocumentAccessControl
- actualizar permisos de acceso para acciones de documentos en SectionExecution

## [1.0.32] - 2026-01-22
### Nuevo
- update asset types and permissions handling
- implementar polling para el estado de aprobación de ejecuciones y mejorar la gestión de estados en los componentes

## [1.0.31] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.31 en package.json
- optimizar filtrado de acciones en DataTable y corregir acceso a datos en UserOrganizationsDialog

## [1.0.30] - 2026-01-22
### Nuevo
- actualizar versión a 1.0.30 en package.json y ajustar permisos en componentes
- enhance user permissions and access control across various pages
- integrar componente HighlightedMarkdown en SectionContentDialog para resaltar contenido
- agregar componentes de estado vacío y esqueleto para la gestión de organizaciones
- comentar la propiedad sectionName en SectionExecutionProps

## [1.0.29] - 2026-01-21
### Nuevo
- actualizar la versión a 1.0.29 en package.json
- aumentar la altura máxima de varios diálogos a 90vh para mejorar la visualización
- optimizar la apertura de diálogos en NavKnowledgeProvider eliminando setTimeout innecesarios
- mejorar la gestión de ejecuciones en AssetContent y SectionExecution para optimizar el feedback y evitar reinicios de estado
- implementar paginación mejorada en componentes de tabla y servicios relacionados
- reemplazar el editor simple por un editor enriquecido en los formularios de sección
- mejorar la lógica de ejecución en AssetContent para manejar contextos de sección y optimizar el feedback
- agregar componente protegido para la creación de organizaciones en OrganizationSelectionDialog
- actualizar la lógica para seleccionar execution_id en CustomWordExportDialog
- corregir referencia a template_name en AssetContent para utilizar documentContent
- mejorar manejo de errores en la creación de activos con mensajes más descriptivos
- mejorar la presentación de dependencias en SortableSectionSheet utilizando Badge
- mejorar la exportación de ejecuciones utilizando fetch y optimizar la obtención del nombre del archivo
- agregar manejo de errores en el editor y mejorar la integración del plugin diffSource
- mejorar presentación de contenido en AssetContent y optimizar lógica de actualización en NavKnowledgeContent
- agregar estilos globales para MDXEditor y mejorar la presentación de contenido
- actualizar etiquetas y mejorar la presentación de secciones en el diálogo de edición de campos personalizados
- agregar función para refrescar el árbol de archivos y mejorar la gestión del contexto de navegación
- agregar vista previa del contenido de la sección y mejorar el selector de referencia
- agregar diálogo para crear plantillas y mejorar el estado vacío en la vista de plantillas
- mejorar estilos en DataTable y PageHeader para una mejor presentación visual
- agregar función de actualización de árbol de archivos y mejorar estilos de contenedores en las páginas de activos y búsqueda
- agregar función getSectionContent para recuperar contenido de secciones
- agregar propiedades opcionales a la interfaz ContentSection para mejorar la flexibilidad del contenido

## [1.0.28] - 2026-01-19
### Nuevo
- actualizar la versión a 1.0.28 en package.json
- eliminar funciones no utilizadas en el encabezado de plantilla para simplificar el código
- agregar hooks y componentes para mejorar la gestión de secciones y encabezados en el contenido de activos
- ajustar tamaños máximos de paneles en la interfaz de activos para mejorar la usabilidad
- agregar componente de lista de campos personalizados y mejorar la interfaz del editor
- agregar funcionalidad de colapso a la tabla de contenido y mejorar la lógica de visualización de elementos
- agregar opciones de tamaño de página adicionales en las páginas de activos, campos personalizados, roles y usuarios
- enhance custom fields and templates UI with pagination and improved styling
- ajustar estilos y mejorar la interfaz en componentes de árbol de archivos y plantillas
- mejorar diseño y funcionalidad de componentes de navegación y organización
- integrar componentes de paneles redimensionables en las páginas de activos y plantillas
- add resizable panel components and hooks for asset navigation and scroll preservation
### Arreglos
- corregir la lógica de activación de enlaces en el menú de navegación

## [1.0.27] - 2026-01-16
### Nuevo
- actualizar la versión a 1.0.27 en package.json
- refactor componentes de navegación y organización, mejorando la gestión de permisos y la interfaz de usuario
- eliminar el componente RichTextEditor
- Enhance ExecuteSheet component with loading states and section handling
- actualizar el texto de carga en el componente FileTree a "Loading..."
- mejorar la gestión de ejecución de documentos, asegurando la selección automática de ejecución y evitando el re-procesamiento de URLs
- agregar tipos y interfaces para la gestión de activos, usuarios y autenticación, incluyendo nuevas propiedades y estados
- agregar funciones para la gestión de documentos, secciones y ejecuciones, incluyendo creación, actualización y eliminación
- agregar nuevas páginas y componentes para la gestión de tipos de activos, usuarios y roles, incluyendo mejoras en la navegación y diálogos reutilizables
- agregar mutación para actualizar el estado de administrador raíz de un usuario
- actualizar importación del tipo User desde '@/types/users'
- add user management dialogs and components
- agregar componentes reutilizables de diálogo y alerta con funcionalidad de confirmación y cancelación
- agregar componentes y diálogos para gestionar plantillas de campos personalizados, incluyendo creación, edición y eliminación
- agregar diálogos y componentes para gestionar plantillas, secciones y acciones relacionadas
- Add section management components with editing and deletion functionality
- agregar componentes para mostrar resultados de búsqueda de documentos y secciones
- add role management components including assign, create, edit, delete, and permissions dialogs
- agregar diálogos para crear, editar, eliminar y seleccionar organizaciones
- agregar componentes para gestionar acciones y diálogos de modelos y proveedores
- reorganizar componentes de navegación y agregar editor de contenido
- add execution status components and feedback mechanisms
- agregar componentes para gestionar y eliminar dependencias de documentos
- add custom fields management components
- agregar componentes para añadir y mostrar contextos, y diálogo de eliminación
- agregar componente MessageBubble y actualizar importaciones
- agregar diálogos para crear, editar y eliminar tipos de autenticación
- agregar formularios de inicio de sesión y registro, y ruta protegida con permisos
- add various asset management dialogs
- agregar tipos para la gestión de activos, tablas y encabezados de página para mejorar la estructura del código
- agregar paginación a las respuestas de AssetTypes, Roles y Users para mejorar la gestión de datos
- agregar paginación a las páginas de AssetTypes, AuthTypes, CustomFields, Roles, Search y Users para mejorar la gestión de datos
- agregar paginación a los hooks useAssetTypesWithRoles y useRoles para mejorar la gestión de datos
- eliminar componente UserFilters y actualizar UserPageHeader y UserTable para mejorar la interfaz de usuario
- agregar componentes DataTable, PageHeader y PageSkeleton para mejorar la interfaz de usuario
- refactor componentes de roles para utilizar PageHeader y PageSkeleton
- simplificar componentes de encabezado y estado de carga utilizando PageHeader y PageSkeleton
- eliminar el componente de sección de ejecución y sus referencias en otros componentes
- eliminar el componente de filtros de campos personalizados y actualizar las referencias en otros componentes
- refactor componentes de autenticación para mejorar la organización y la claridad
- refactor y centralizar tipos de activos en un solo archivo para mejorar la organización y claridad
- eliminar el componente de filtros de tipo de activo y actualizar las referencias en otros componentes
- refactor imports to use type imports for better clarity and organization
### Otros
- refactor: actualizar importación de getDocumentSections desde el servicio de assets
- refactor: actualizar rutas protegidas y corregir importaciones de componentes
- refactor: remove user management components and related types
- refactor: remove file tree components and related types

## [1.0.26] - 2026-01-12
### Nuevo
- actualizar la versión a 1.0.26 en package.json
- mejorar estilos y z-index en componentes de edición y sección
- agregar soporte para campos personalizados en el diálogo de selección de organización

## [1.0.25] - 2026-01-08
### Nuevo
- actualizar la versión a 1.0.25 en package.json
- actualizar diálogos de campos personalizados para mostrar el prompt solo cuando la fuente es inferida y mejorar la visualización de imágenes en la tabla
- add AddCustomFieldDocumentDialog and EditCustomFieldDocumentDialog components
- actualizar dependencias de Radix UI y corregir versiones en package.json
- eliminar declaración "use client" en el componente Label y agregar nuevos componentes RadioGroup y Switch
- add custom field template management
- corregir rutas de API en funciones addTextContext y addDocumentContext

## [1.0.24] - 2026-01-07
### Nuevo
- actualizar la versión a 1.0.24 en package.json
- add custom fields management components and functionality
- mejorar manejo de ejecuciones en AssetContent y ExecuteSheet, optimizando la lógica de selección y notificación
- agregar restauración de scroll y optimizar manejo de scroll en componentes AssetContent y SectionExecution

## [1.0.23] - 2026-01-06
### Nuevo
- actualizar la versión a 1.0.23 en package.json
- refactor dialog handling and improve organization selection logic in TeamSwitcher and related components
- mejorar la selección de ejecuciones en el componente AssetContent y ajustar la lógica de botones de aprobación/desaprobación
- agregar exportación a Word personalizado y mejorar gestión de ejecución en el componente AssetContent
- agregar nuevo modo de ejecución 'full-single' en el componente ExecutionFeedback
- agregar nuevos estados de ejecución y mejorar la gestión de notificaciones en el componente ExecuteSheet
- agregar contexto de ejecución en el componente ExecuteSheet y mejorar la gestión de secciones en la ejecución de documentos
- ajustar el espaciado y la alineación en el componente FileTree para una mejor representación visual
- mejorar la representación visual de nodos en el componente FileTree al agregar indicadores de último hijo
- actualizar estilos de Badge a variante 'outline' en múltiples componentes
- agregar funcionalidad de preservación de desplazamiento en el componente de activos y mejorar la gestión de organización
- reemplazar el diálogo de actualización de perfil por el diálogo de edición de usuario y crear nuevo diálogo para crear usuario
- refactor gestión de permisos en componentes de roles y actualizar la estructura de respuesta de permisos
- agregar funcionalidad para obtener contenido de ejecución de sección y mejorar el resaltado de búsqueda en el diálogo de contenido
- actualizar importaciones de FileTree y MenuAction para mejorar la estructura del código
- renombrar importación de SectionExecution y crear nuevo componente asset-section para mejorar la estructura del código
- actualizar rutas de API en los servicios de contexto y ejecuciones para mejorar la consistencia
- agregar propiedad minHeight al componente FileTree para mejorar la gestión de altura
- agregar funciones para la gestión de carpetas en la biblioteca y definir la interfaz MenuAction
- simplificar el componente AssetsContent eliminando código innecesario y optimizando la gestión de estado
- actualizar estilos de TooltipContent para mejorar la apariencia y consistencia
- actualizar ExecuteSheet y SectionSheet para mejorar la gestión de ejecuciones y secciones
- Integrar NavKnowledge en el sidebar y mejorar la gestión de navegación
- Refactor asset content and dialogs for improved execution handling and UI updates
### Otros
- Implement code changes to enhance functionality and improve performance
- Refactor document and folder management components

## [1.0.22] - 2026-01-04
### Nuevo
- agregar diálogo para asignar roles a usuarios y mejorar la gestión de roles
- agregar clase de estilo al título del elemento de navegación
- mostrar opción de agregar organización solo para administradores root
- agregar menú desplegable de configuración con opciones basadas en permisos
- actualizar la importación de RolesPage a la nueva ruta en App.tsx
### Otros
- actualizar la versión a 1.0.22 en package.json
- refactor: eliminar importaciones no utilizadas y optimizar el código en componentes de árbol de archivos y hoja de ejecución
- Estandarizacion y estabilizacion de aplicacion
- refactor: replace deprecated users-page component with optimized version
- refactor: restructure roles management components and improve user experience

## [1.0.21] - 2025-12-23
### Nuevo
- actualizar la versión a 1.0.21 en package.json

## [1.0.20] - 2025-12-19
### Nuevo
- actualizar la versión a 1.0.20 en package.json
- cambiar texto de "Delete Execution" a "Delete Version" en varios componentes
- eliminar importación no utilizada de SearchResult en search.tsx
- mejorar la búsqueda de documentos y secciones en la página de búsqueda

## [1.0.19] - 2025-12-19
### Nuevo
- actualizar la versión a 1.0.19 en package.json
- simplificar las condiciones de acceso en SectionExecution

## [0.0.19] - 2025-12-19
### Nuevo
- actualizar la versión a 0.0.19 en package.json
- auto-inicializar selectedExecutionId al cargar un documento
- mejorar la presentación de la descripción del template en TemplateContent
- mejorar la visualización de versiones en AssetContent con nombres de ejecución truncados
- agregar soporte para arrastrar y soltar secciones en TemplateContent
- agregar manejo de éxito en la asignación de roles y refrescar lista de usuarios

## [0.0.18] - 2025-12-19
### Nuevo
- actualizar la versión a 0.0.18 en package.json
- optimizar la gestión de estado y polling en los componentes de ejecución y contenido
- mejorar la visualización de versiones en el componente AssetContent con ordenamiento de ejecuciones
- implementar hook useRoleDocumentTypes para obtener tipos de documento según el rol del usuario
- refactor FileTreeItemWithContext para optimizar la gestión de carpetas y eliminar CreateDocumentLib
- mejorar la gestión de carpetas en el componente FileTreeItem con callbacks para actualizaciones de hijos y optimización del estado expandido

## [0.0.17] - 2025-12-18
### Nuevo
- actualizar la versión a 0.0.17 en package.json
- actualizar la asignación de roles a usuarios para utilizar el endpoint en bulk y agregar encabezados en la obtención de permisos de rol
- optimizar la gestión de contenido de la biblioteca con mejoras en la recuperación y conversión de elementos
- agregar propiedad accessLevels a los componentes ContextSheet, DependenciesSheet y SectionSheet para mejorar la gestión de permisos
- Add CreateDocumentLib component for document creation and management
- agregar propiedad isSheetOpen a los componentes AddContextSheet y AddDependencySheet para controlar su estado de apertura
- mejorar el componente TeamSwitcher con manejo de creación de organizaciones y descripción opcional
- mejorar el manejo de fechas de la API con nuevas funciones de formato y análisis
- implementar contexto para manejo de carpetas expandidas y re-expansión automática tras refresh
- agregar manejo de niveles de acceso y tipo de documento en FileNode
### Otros
- refactor: eliminar lógica de gestión de organizaciones en el componente AppSidebar
- Refactor file tree components to enhance drag-and-drop functionality

## [0.0.16] - 2025-12-18
### Nuevo
- actualizar la versión a 0.0.16 en package.json
- agregar opción "Mover a raíz" en el menú contextual y mejorar el manejo de documentos
- ajustar parámetros de sensores para mejorar la detección de arrastre y clics
- corregir el nombre del campo para mover documentos a la carpeta en la función moveDocument
- mejorar controles de acceso en el menú desplegable y contexto para la creación de carpetas y activos
- reemplazar botones por DocumentActionButton en las hojas de contexto, dependencias y secciones para mejorar el control de acceso a documentos
- integrar controles de acceso a documentos en la sección de ejecución y en el contenido de la biblioteca
- eliminar componentes de creación y edición de documentos en la biblioteca
- implementar funcionalidad de arrastrar y soltar en el árbol de archivos y mejorar el control de acceso a documentos
- eliminar variable innecesaria en ExecutionStatusBanner al usar useOrganization
- add execution deletion functionality and improve document deletion options
- mejorar manejo de permisos en RolePermissionsDialog; usar formato correcto para bulkGrantAccess
- agregar función bulkGrantAccess para asignar permisos de rol a documentos en masa
- actualizar intervalos de polling y refetch en useExecutionsByDocumentId; agregar función bulkGrantAccess en useRoleDocumentType
- simplificar clase de botón de eliminación de usuario en el diálogo de organizaciones

## [0.0.15] - 2025-12-17
### Nuevo
- actualizar la versión a 0.0.15 en package.json
- agregar funcionalidad para eliminar usuarios de organizaciones
- agregar nueva interfaz y funciones para la ejecución de generación de documentos
- incluir niveles de acceso en la selección de documentos y actualizar la URL al seleccionar archivos
- agregar utilidades para la gestión de JWT, incluyendo decodificación y verificación de permisos
- agregar hooks para gestión de niveles de acceso y permisos de usuario
- agregar contexto de permisos con funciones de verificación y manejo de estado
- mejorar la ejecución de documentos añadiendo selección de modelo de lenguaje y configuraciones de ejecución
- agregar configuración de ejecución y mejorar el manejo de permisos en el contenido de la biblioteca
- mejorar la gestión de permisos en el layout y sidebar, añadiendo lógica para mostrar elementos de navegación basados en permisos de usuario
- implement document access control components and examples
- integrar manejo de permisos en las rutas de la aplicación
- mejorar el diseño de las páginas de tipos de activos, tipos de autenticación, roles y usuarios; eliminar el uso de min-h-screen en los contenedores

## [0.0.14] - 2025-12-17
### Nuevo
- actualizar la versión a 0.0.14 en package.json
- Add organization ID support across services and enhance error handling
- integrate organization context into document, execution, and template pages
- refactor httpClient para gestionar tokens de autenticación y organización; mejorar manejo de errores de autorización
- agregar hooks para gestión de tipos de activos, tipos de autenticación, tipos de documentos, y gestión de usuarios; mejorar la gestión de organizaciones en hooks existentes
- agregar gestión de token de organización en el contexto de organización y mejorar la restauración de datos desde localStorage
- integrate organization context into template management and user dialogs
- agregar ruta para el componente AssetTypesPage en App.tsx
- agregar dependencia @radix-ui/react-scroll-area en package.json
- agregar diálogo de selección de organización y mejorar gestión de organizaciones en el contexto

## [0.0.13] - 2025-12-12
### Nuevo
- actualizar la versión a 0.0.13 en package.json
- actualizar la función createFolder para usar un objeto de solicitud y mejorar la gestión de carpetas; agregar función createSectionExecution con manejo de errores
- implementar diálogos para crear carpetas y activos en el componente Assets
- agregar hooks useRequiredOrganization y useOrganizationId para gestión de selección de organización
- agregar estado y funcionalidad para la selección de organización en OrganizationContext
- actualizar colores de tema en index.css para mejorar la accesibilidad y la estética
- Refactor EditFolder component to use react-query for folder editing and improve dialog handling
- agregar rutas para tipos de autenticación, usuarios y roles en App.tsx
- agregar dependencias date-fns y react-day-picker en package.json
- agregar diálogo de actualización de perfil y funcionalidad de actualización de usuario
- actualizar formularios de autenticación para usar nombre y apellido en lugar de nombre de usuario

## [0.0.12] - 2025-12-05
### Nuevo
- actualizar la versión de la aplicación a 0.0.12 en package.json
- agregar versión de la aplicación en los formularios de autenticación
- agregar página de autenticación con manejo de login, signup y OTP
- implementar cliente HTTP con manejo de autenticación y métodos de solicitud
- agregar contexto de autenticación con manejo de usuario y token
- agregar componentes Field, InputOTP y WisecoreLogo, y optimizar Button, Label y Separator
- agregar funcionalidad de ejecución de secciones en el componente SectionExecution
- agregar componente NavUser al sidebar
- optimizar el manejo del diálogo de eliminación de carpetas
- agregar formularios de inicio de sesión y registro, y ruta protegida
- implementar formulario OTP para verificación de código
- envolver rutas en AuthProvider y ProtectedRoute para gestión de autenticación
- agregar logo de Wisecore a los activos del proyecto
### Otros
- refactor: comentar importaciones y funciones no utilizadas en NavUser
- Refactor API calls to use httpClient for consistency and improved error handling across services

## [0.0.11] - 2025-11-27
### Nuevo
- actualizar la versión a 0.0.11 y corregir la versión de @radix-ui/react-label en package.json
- mejorar la lógica de selección de ejecuciones en el componente AssetContent
- comentar lógica de deshabilitación y carga de dependencia en el componente AddDependencySheet
- mejorar el diálogo de creación de organización con nueva descripción y estilos
- agregar nuevos plugins y mejorar la interfaz del editor con opciones de enlace e imagen

## [0.0.10] - 2025-11-20
### Nuevo
- actualizar la versión a 0.0.10 en package.json
- actualizar la interfaz de ItemForBackend y ajustar la lógica de guardado para compatibilidad con el backend

## [0.0.9] - 2025-11-19
### Nuevo
- actualizar la versión a 0.0.9 en package.json
- mejorar el diseño y la usabilidad del chatbot con ajustes en estilos y espaciado
- ajustar el espaciado y el diseño de los componentes en la vista de activos para mejorar la usabilidad
- mejorar la presentación de tipos de documento y plantillas en la vista de activos
- agregar validación de formulario en la creación de secciones para mejorar la experiencia del usuario
- agregar tipo opcional en createTemplateSection para asegurar envío de tipo por defecto
- agregar tipo opcional en createSection para asegurar envío de tipo por defecto
- eliminar la llamada a getUserLocale en formatDateTime para optimizar el rendimiento
- agregar validación de formulario y restablecer estado al crear sección
- mejorar la función de envío de secciones para incluir un tipo de sección opcional
- actualizar la función de envío de secciones para incluir campos opcionales de document_id y template_id
- agregar soporte para templateId y mejorar la validación en el formulario de sección
- actualizar estilos de botones y eliminar código comentado en el componente AssetContent
- agregar funciones de formateo de fecha y hora según la configuración regional del usuario
- agregar información de versión seleccionada en el componente AssetContent
- establecer el estado inicial del sidebar de contenido a abierto
- mejorar diseño y funcionalidad de componentes de biblioteca y activos

## [0.0.8] - 2025-11-19
### Nuevo
- actualizar la versión a 0.0.8 en package.json
- habilitar la actualización automática de datos en el enfoque de la ventana y reconexiones
- actualizar claves de consulta para incluir el ID de organización seleccionado
- actualizar ruta de activos para permitir subrutas dinámicas
- invalidar consulta de plantillas para actualizar la lista en CreateDocumentLib
- agregar sombra a los mensajes de vista previa de IA para mejorar la visibilidad
- agregar componente Empty y sus subcomponentes para mejorar la interfaz de usuario
- reemplazar ActionStepper por componente Empty para mejorar la experiencia de usuario al crear activos

## [0.0.7] - 2025-11-18
### Nuevo
- actualizar rutas de "assets" a "asset" en toda la aplicación para simplificar la navegación
- simplificar configuración de navegación al eliminar rutas y extensiones innecesarias en staticwebapp.config.json
- actualizar configuración de navegación y rutas en staticwebapp.config.json
### Arreglos
- revert versión de la aplicación a 0.0.7 en package.json

## [1.0.0] - 2025-11-18
### Nuevo
- actualizar versión de la aplicación a 1.0.0 y mostrarla en AppLayout
- ocultar información del usuario en AppSidebar para mejorar la privacidad
- eliminar referencias a la funcionalidad de biblioteca en App y AppLayout para simplificar la navegación
- refactor interfaces y servicios de proveedores LLM para mejorar la estructura y la tipificación
- mejorar la gestión de proveedores en ModelsPage, optimizando la configuración y eliminando funciones innecesarias
- corregir rutas de assets en App para evitar coincidencias no deseadas
- agregar menú desplegable para editar y eliminar proveedores y modelos en ModelsPage
- agregar funciones para actualizar y eliminar LLMs en llms.ts
- eliminar llamada a handleCreateTemplate y agregar callback para manejar la eliminación de plantillas en Templates
- agregar funciones para editar y eliminar modelos y proveedores en ModelsPage
- actualizar función de mutación para LLM en ExecutionPage
- agregar callback para manejar la eliminación de plantillas en TemplateContent
- actualizar función de mutación para LLM en ExecuteSheet
- agregar función para actualizar el orden de las secciones y mejorar la gestión de templates
- agregar manejo de errores en las funciones de gestión de proveedores y LLMs
- agregar función para generación de documentos sin streaming y nueva interfaz de parámetros
- agregar función para obtener el estado de la ejecución con manejo de errores
- agregar gestión de templates con creación y eliminación, y mejorar la búsqueda
- mejorar la página de búsqueda con un nuevo diseño y manejo de resultados
- agregar página Models para gestionar proveedores y modelos de LLM con soporte para creación y edición
- optimizar gestión de archivos y carpetas en el componente Assets con mejoras en la navegación y estado del sidebar
- agregar hook useExecutionPolling para gestionar el estado de ejecución con polling
- agregar componente Table con sus subcomponentes para gestión de tablas
- agregar componente Collapsible con Trigger y Content para gestión de colapsables
- agregar soporte para vista móvil en CollapsibleSidebar con integración de Sheet
- agregar componente Avatar con imágenes y fallback para gestión de avatares
- agregar componente TemplateContent para gestión de plantillas y secciones
- agregar componente TemplateConfigSheet para gestión de secciones de plantilla
- agregar exportaciones de ContextSheet, TemplateConfigSheet y ExecutionInfoSheet en el índice de hojas
- enhance mobile responsiveness and UI improvements across sheets
- enhance library content component with section management and template creation
- Mejorar la interfaz del componente SectionExecution, añadiendo botones de acción y soporte para dispositivos móviles
- Rediseñar el formulario de creación de activos, mejorando la presentación y la usabilidad
- Mejorar la estructura y navegación del componente AppSidebar, añadiendo soporte para organizaciones y optimizando el manejo de rutas
- Ajustar el espaciado en el componente FileTree para mejorar la presentación
- Actualizar la función onShare para incluir un parámetro isAutomatic y mejorar el manejo de URLs
- Agregar componente TeamSwitcher para gestionar organizaciones
- Mejorar el estilo y la presentación del componente SortableSectionSheet
- Eliminar la función de detección de tipo de sección y su uso en SectionExecutionSheet
- Integrar ReactMarkdown en SearchResult para mejorar el renderizado de contenido
- Agregar componente NavUser para mostrar información del usuario y acciones de perfil
- Agregar componente NavMain para la navegación con soporte de submenús
- Agregar componente ExecutionStatusBanner para mostrar el estado de ejecución con notificaciones y manejo de errores
- Simplificar el componente ExecutionInfoSheet eliminando funciones de exportación y mejorando la gestión de ejecuciones
- Agregar nuevo componente para la edición de secciones de plantilla
- Mejorar el diálogo de edición de documentos con nuevo diseño y validación de formulario
- Actualizar la selección de documentos para incluir objeto completo y mejorar la accesibilidad
- Mejorar el formulario de creación de carpetas con validación y nuevos íconos
- Mejorar la visualización del contenido en ContextDisplay con soporte para expansión y truncamiento
- Agregar ID al formulario de sección para mejorar la accesibilidad
- Agregar nuevo archivo add_template_section_form para la gestión de secciones de plantilla
- Modificar la función handleSelectDocument para aceptar un objeto de documento y agregar propiedades de estilo al componente de selección
- Mejorar la gestión de archivos en AddContextSheet con referencia a input y limpieza de estado
- Agregar componente ActionStepper para guiar a los usuarios a través de pasos
- Configurar opciones de QueryClient y suprimir errores de extensiones del navegador
- Actualizar color de fondo de la barra lateral a blanco para mejorar la visibilidad
- Agregar ruta para la página de modelos y corregir ruta de activos
- Agregar dependencias de Radix UI para avatar y colapsables
- Agregar componente Assets para gestión de archivos y carpetas
- Agregar hook useIsMobile para detección de dispositivos móviles
- Agregar componente Sidebar para gestión de barras laterales
- Agregar componente CollapsibleSidebar para gestión de barras laterales colapsables
- Agregar componente SectionSheet para gestión de secciones de documentos
- Agregar archivo index.ts para exportar componentes de hojas
- Agregar componente ExecuteSheet para gestión de ejecuciones de documentos
- Agregar componente DependenciesSheet para gestión de dependencias de documentos
- Agregar componente ContextSheet para gestión de contexto de documentos
- Agregar componente AssetContent para gestión de documentos y secciones
- Agregar componente AppSidebar con gestión de organizaciones y navegación
- Agregar componente AppLayout con navegación de rutas y soporte para breadcrumbs
- Agregar componentes para la gestión de archivos y carpetas con soporte de búsqueda y contexto
- Agregar componente FileTreeItemWithContext para gestionar la visualización y manipulación de archivos y carpetas
- Agregar componente FileSearch para buscar y filtrar nodos de archivos y carpetas
- Agregar componente SortableSectionSheet para gestionar secciones de documento con funcionalidad de edición y eliminación
- Agregar opción de navegación para "Assets" en la barra lateral
- Agregar componente SectionPreviewSheet para mostrar y gestionar secciones de documento
- Agregar componente SectionExecutionSheet para gestionar y editar secciones de ejecución
- Agregar componente ExecutionInfoSheet para gestionar y exportar información de ejecuciones
- Agregar componente ExecutionConfigSheet con funcionalidad para configurar y gestionar la ejecución de modelos de IA
- Agregar componente EditSectionSheet con funcionalidad para editar secciones y gestionar dependencias
- Agregar componente EditFolder con funcionalidad para editar nombres de carpetas
- Agregar componente DocumentTreeSelector con funcionalidad de búsqueda y filtrado de documentos
- Agregar componente DocumentSelectorTree con funcionalidad de búsqueda y filtrado de documentos
- Agregar componente DocumentInfoSheet con visualización de información del documento y conteo de secciones
- Agregar callback onFolderCreated y mejorar la invalidación de queries en CreateFolder
- Actualizar el componente de diseño de la aplicación a AppLayout
- Agregar formulario para añadir secciones con generación de prompts y gestión de dependencias
- Agregar componente para gestionar dependencias de documentos con funciones de añadir y eliminar
- Agregar componente para gestionar contextos con funciones de añadir y eliminar
- Agregar función para mover documentos en el servicio de documentos
- Agregar funciones para editar y mover carpetas en el servicio de biblioteca
- Refactor y mover funciones de manejo de secciones de plantilla a un nuevo archivo de servicio
- Calcular límites SVG basados en las posiciones de los nodos en el gráfico de red
- Añadir funcionalidad para subir plantillas DOCX y exportar ejecuciones a Markdown y Word
- Añadir .vite al archivo .gitignore para excluir archivos de construcción
- Eliminar flujo de trabajo de CI/CD para Azure Static Web Apps
- Actualizar mensajes del chatbot a inglés y modificar el placeholder del input
- Añadir marcadores de flecha y mejorar el cálculo de conexiones en el gráfico de red
- Añadir soporte para búsqueda por organización en la función de búsqueda
- Integrar MDXEditor en formularios de sección y editar sección, mejorando la experiencia de edición de contenido
- Añadir funcionalidad para eliminar secciones con diálogo de confirmación y actualizar servicios relacionados
- Añadir funcionalidad de edición de documentos con diálogo y actualización en la biblioteca
- Integrar organización en la creación y obtención de tipos de documentos y plantillas
- Añadir generación de secciones con IA en documentos y plantillas, y mejorar el diseño de componentes
- Ajustar el espaciado en el contenedor de contenido del documento
- Mejorar la funcionalidad del editor y la gestión de secciones en la biblioteca
- Eliminar importación no utilizada de icono de red en el componente Sidebar
- Agregar navegación a la página de gráfico y persistir estado en sessionStorage
- Ajustar estilos de burbujas de mensajes y mejorar la funcionalidad del chatbot
- Agregar página de gráfico de red y enlazar en la barra lateral
- Eliminar la opción de crear documentos en la barra lateral y agregar encabezado de organización en la creación de plantillas
- Implement library management features including folder creation, sidebar navigation, and organization selection
- Agregar tabla de contenidos en ejecución
- agregar funcionalidad para aprobar ejecuciones, incluyendo manejo de estado y notificaciones
- agregar componente SearchResult y mejorar la página de búsqueda, incluyendo manejo de resultados y carga
- mejorar manejo de secciones en ExecutionPage, incluyendo procesamiento de texto pendiente y actualización de secciones editables
- mejorar manejo de generación de documentos, incluyendo optimización de eventos y limpieza de promesas
- agregar funcionalidad para generar prompts con IA en el componente AddSectionForm, incluyendo manejo de errores y estado de generación
- agregar funcionalidad para eliminar secciones en los componentes de configuración y ejecución, incluyendo la lógica de eliminación en los servicios correspondientes
- agregar funcionalidad para gestionar organizaciones, incluyendo creación y listado. También manejar el reordenamiento de secciones
- agregar nuevos plugins y mejorar la barra de herramientas en el componente Editor
- agregar funcionalidad para editar contenido con IA en el componente SectionExecution y mejorar el manejo de secciones
- agregar funcionalidad para eliminar ejecuciones y mejorar el manejo de errores en la generación de documentos
- enhance layout and sidebar functionality, add LLM selection
- agregar función onUpdate para actualizar secciones en el componente SectionExecution
- integrate MDXEditor for content editing in SectionExecution component
- actualizar manejo de dependencias en secciones y agregar funciones para crear y actualizar secciones
- actualizar manejo de estado de organización y errores en los componentes de documentos y plantillas
- Agregar variable de entorno VITE_API_URL en el flujo de trabajo de Azure Static Web Apps
- Eliminar archivo de configuración de Azure Static Web Apps
- Agrega variable de entorno VITE_API_URL en el flujo de trabajo de Azure Static Web Apps
- Implement context management with text and document addition, deletion, and improved UI interactions feat: Enhance dependency management with document fetching and improved UI for adding/removing dependencies feat: Update context display to support Markdown rendering and improved delete functionality feat: Add document deletion functionality with confirmation dialog and improved UI feedback feat: Introduce section editing capabilities with dependency management and improved UI feat: Implement organization management in documents and templates with filtering options feat: Add export functionality for templates and improve template creation with organization selection feat: Create organization service for fetching organization data
- Corrige instrucciones de ejecución, agrega tooltip para instrucciones en la página de ejecución y actualiza la gestión de secciones
- enhance document management with alert dialogs and dropdown menus
- add dropdown menu and markdown components; integrate fetch-event-source for document generation
- add document dependencies and context management features
- agrega página de ejecución, mejora la gestión de ejecuciones y actualiza la interfaz de usuario
- agrega página de configuración de documentos y mejora la gestión de secciones
- add next-themes and sonner packages, update App routing, and enhance document management
### Arreglos
- corregir ancho de la barra lateral a 15rem
- Actualizar versiones de dependencias de Radix UI en package.json
- Corregir la URL de búsqueda en la función de búsqueda
- Arreglando congelamiento de la UI cuando se usan Dialogs o AlertDialog
- Arreglando congelamiento de la UI
- Arreglar problema con tanstack
### Otros
- Merge pull request #12 from HuemulSolutions/modules
- Migración a modulos en backend, corrección de rutas y mejor manejo de breadcrum en library
- Merge pull request #11 from HuemulSolutions/DevSilva-2025-10
- Update dev_web-hs-wisecore-dev-1.yml
- Add or update the Azure App Service build and deployment workflow config
- Merge branch 'dev' of https://github.com/HuemulSolutions/wisecore-front into dev
- Merge pull request #4 from HuemulSolutions/DevSilva-09-2025
- Merge branch 'dev' into DevSilva-09-2025
- Añadiendo chatbot y conectando botones de eliminar
- Refactor library components and implement chatbot functionality
- Añadir tipo de documento
- ci: add Azure Static Web Apps workflow file on-behalf-of: @Azure opensource@microsoft.com
- Agregando exportar y configurando github action
- ci: add Azure Static Web Apps workflow file on-behalf-of: @Azure opensource@microsoft.com
- Merge branch 'dev-2' of https://github.com/HuemulSolutions/wisecore-front into dev-2
- Merge branch 'main' into dev-2
- Agrega formulario para añadir secciones a la plantilla: se implementa el componente AddSectionForm, se añade la lógica para manejar la creación de secciones y se mejora la interfaz de usuario con un botón para agregar secciones.
- Agrega funcionalidad para eliminar plantillas y mejora la interfaz de configuración: se implementa un botón de eliminación en la página de configuración de plantillas, se añade la función deleteTemplate en el servicio y se mejora la visualización de secciones de plantilla.
- Agrega funcionalidad para gestionar plantillas: se implementa un diálogo para crear nuevas plantillas, se actualiza la navegación y se elimina la página de agregar plantilla. Se añaden nuevas dependencias y se mejora la gestión de plantillas existentes.
- Agrega nuevas páginas y componentes para la gestión de plantillas, incluyendo la funcionalidad para agregar y listar plantillas. Mejora la interfaz de usuario con nuevos elementos y estilos, y actualiza las dependencias necesarias.
- Corrige la rama de despliegue en el flujo de trabajo de GitHub Actions de 'develop' a 'dev'
- Agrega archivo de configuración para despliegue en Code Engine y establece la variable de entorno VITE_API_URL en el Dockerfile.
- Actualiza la estructura del proyecto: modifica el HTML, elimina archivos innecesarios, implementa un componente Document y mejora la gestión de ejecuciones.
- Pantallas principales
- Agregar archivo .gitignore para excluir node_modules

## [0.0.0] - 2025-05-26
### Otros
- Configuración inicial
- Initial commit

<!-- changelog-last-commit: 4df31217b5d2d8cae5b5b4725e31a903ef701863 -->
