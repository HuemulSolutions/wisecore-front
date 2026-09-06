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
    mediaViewMode: { en: "Default media view", es: "Vista de media por defecto" },
    mediaViewModeGrid: { en: "Grid", es: "Cuadrícula" },
    mediaViewModeList: { en: "List", es: "Lista" },
  },
  assetTree: {
    title: { en: "Knowledge tree", es: "Árbol de conocimiento" },
    rememberExpanded: { en: "Remember expanded folders", es: "Recordar carpetas expandidas" },
    rememberExpandedHint: {
      en: "Keeps the folders you opened in /asset expanded the next time you visit.",
      es: "Mantiene abiertas las carpetas de /asset en la próxima visita.",
    },
    forgetExpanded: { en: "Forget saved folders", es: "Olvidar carpetas guardadas" },
    forgetExpandedSuccess: { en: "Saved folders cleared", es: "Carpetas guardadas eliminadas" },
  },
} as const

export default translations
