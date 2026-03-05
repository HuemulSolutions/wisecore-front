import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import commonEs from './locales/es/common.json'
import globalAdminEn from './locales/en/global-admin.json'
import globalAdminEs from './locales/es/global-admin.json'
import organizationsEn from './locales/en/organizations.json'
import organizationsEs from './locales/es/organizations.json'
import usersEn from './locales/en/users.json'
import usersEs from './locales/es/users.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        'global-admin': globalAdminEn,
        organizations: organizationsEn,
        users: usersEn,
      },
      es: {
        common: commonEs,
        'global-admin': globalAdminEs,
        organizations: organizationsEs,
        users: usersEs,
      },
    },
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'global-admin', 'organizations', 'users'],
    defaultNS: 'common',
  })

export default i18n
