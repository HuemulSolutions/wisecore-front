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

export default i18n
