import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import common from './locales/common'
import globalAdmin from './locales/global-admin'
import organizations from './locales/organizations'
import users from './locales/users'
import models from './locales/models'
import authTypes from './locales/auth-types'
import roles from './locales/roles'
import assetTypes from './locales/asset-types'
import assets from './locales/assets'
import customFields from './locales/custom-fields'
import context from './locales/context'
import dependencies from './locales/dependencies'
import sections from './locales/sections'
import execute from './locales/execute'
import home from './locales/home'
import layout from './locales/layout'
import templates from './locales/templates'
import search from './locales/search'
import auth from './locales/auth'
import editor from './locales/editor'
import advanced from './locales/advanced'
import externalSystems from './locales/external-systems'
import externalFunctionalities from './locales/external-functionalities'
import externalSecrets from './locales/external-secrets'
import externalParameters from './locales/external-parameters'
import chatbot from './locales/chatbot'
import huemulFilters from './locales/huemul-filters'
import huemulFileTree from './locales/huemul-file-tree'
import canvas from './locales/canvas'
import diagrams from './locales/diagrams'
import documentTypeRelationships from './locales/document-type-relationships'
import media from './locales/media'
import subscriptions from './locales/subscriptions'
import notifications from './locales/notifications'
import roleFolder from './locales/role-folder'
import workflow from './locales/workflow'

// Each module defines translations per-key: { myKey: { en: "...", es: "..." } }
// This helper extracts a single language from the tree so i18next can consume it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLang(tree: Record<string, any>, lang: string): Record<string, any> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (typeof value['en'] === 'string') {
        // Leaf node: { en: "...", es: "..." }
        result[key] = value[lang] ?? value['en']
      } else {
        // Branch node: recurse
        result[key] = extractLang(value, lang)
      }
    }
  }
  return result
}

const modules = {
  common,
  'global-admin': globalAdmin,
  organizations,
  users,
  models,
  'auth-types': authTypes,
  roles,
  'asset-types': assetTypes,
  assets,
  'custom-fields': customFields,
  context,
  dependencies,
  sections,
  execute,
  home,
  layout,
  templates,
  search,
  auth,
  editor,
  advanced,
  'external-systems': externalSystems,
  'external-functionalities': externalFunctionalities,
  'external-secrets': externalSecrets,
  'external-parameters': externalParameters,
  chatbot,
  'huemul-filters': huemulFilters,
  'huemul-file-tree': huemulFileTree,
  canvas,
  diagrams,
  'document-type-relationships': documentTypeRelationships,
  media,
  subscriptions,
  notifications,
  'role-folder': roleFolder,
  workflow,
} as const

const supportedLanguages = ['en', 'es'] as const

const resources = Object.fromEntries(
  supportedLanguages.map((lang) => [
    lang,
    Object.fromEntries(
      Object.entries(modules).map(([ns, translations]) => [
        ns,
        extractLang(translations, lang),
      ])
    ),
  ])
)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    ns: Object.keys(modules),
    defaultNS: 'common',
  })

// Mantiene <html lang> alineado con el idioma real que i18next eligió, y
// reafirma el opt-out de traducción automática. index.html ya declara
// lang="es" + translate="no" + <meta name="google" content="notranslate">,
// pero eso solo cubre el HTML servido; esto lo mantiene correcto cuando el
// detector ('navigator' primero) resuelve un idioma distinto. Un <html lang>
// desalineado del contenido real es lo que dispara el traductor del
// navegador, que reparenta nodos de texto (<font>) y provoca
// "NotFoundError: Failed to execute 'removeChild'" cuando React intenta
// actualizar ese subárbol — se ejecuta a nivel de módulo (antes de
// createRoot en main.tsx) para llegar antes del primer paint.
function syncDocumentLang(lng?: string) {
  const base = (lng ?? 'en').split('-')[0] as (typeof supportedLanguages)[number]
  const resolved = supportedLanguages.includes(base) ? base : 'en'
  const html = document.documentElement
  html.lang = resolved
  html.setAttribute('translate', 'no')
  html.classList.add('notranslate')
  if (/\btranslated-(ltr|rtl)\b/.test(html.className)) {
    console.warn('[wisecore] pagina traducida por el navegador')
  }
}

syncDocumentLang(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', syncDocumentLang)

export default i18n
