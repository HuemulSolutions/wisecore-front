const translations = {
  sheet: {
    title: { en: "Preferences", es: "Preferencias" },
    description: {
      en: "These are your own preferences — they follow you across devices.",
      es: "Son preferencias personales — se aplican en todos los dispositivos.",
    },
  },
  appearance: {
    title: { en: "Appearance", es: "Apariencia" },
    language: { en: "Language", es: "Idioma" },
    languageSpanish: { en: "Spanish", es: "Español" },
    languageEnglish: { en: "English", es: "English" },
    mediaViewMode: { en: "Default resource view", es: "Vista de recursos por defecto" },
    mediaViewModeGrid: { en: "Grid", es: "Cuadrícula" },
    mediaViewModeList: { en: "List", es: "Lista" },
  },
  assetTree: {
    title: { en: "Navigation trees", es: "Árboles de navegación" },
    rememberExpanded: { en: "Remember expanded folders", es: "Recordar carpetas expandidas" },
    rememberExpandedHint: {
      en: "Keeps the folders you opened expanded next time — in the asset library, selectors, and external systems.",
      es: "Mantiene abiertas las carpetas que abriste — en la biblioteca de activos, selectores y sistemas externos.",
    },
    forgetExpanded: { en: "Forget saved folders", es: "Olvidar carpetas guardadas" },
    forgetExpandedSuccess: { en: "Saved folders cleared", es: "Carpetas guardadas eliminadas" },
  },
} as const

export default translations
