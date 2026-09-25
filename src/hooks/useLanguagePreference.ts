import { useEffect, useRef } from "react"
import i18n, { resolveSupportedLanguage } from "@/i18n"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPreference } from "./useUserPreference"
import type { LanguagePreference } from "@/types/user-preferences"

const PREF_KEY = "language"

function parseLanguage(raw: unknown): LanguagePreference | null {
  const language = raw && typeof raw === "object" ? (raw as { language?: unknown }).language : raw
  return language === "en" || language === "es" ? { language } : null
}

/**
 * Preferencia de idioma vía `useUserPreference`: localStorage (mismo caché
 * que ya usa i18next-browser-languagedetector, ver `src/i18n/index.ts`) para
 * pintado instantáneo, servidor (`/user/preferences/language`) para que el
 * idioma elegido siga al usuario entre dispositivos/navegadores.
 *
 * Scope usuario × organización (igual que el resto de las preferencias): el
 * idioma puede diferir entre organizaciones del mismo usuario — es el
 * comportamiento esperado, no un bug.
 *
 * Se monta una sola vez, en `AppLayout` (fuera del sheet de Preferencias),
 * para que un idioma guardado en otro dispositivo aplique apenas resuelve el
 * `GET`, sin depender de que el usuario abra el sheet.
 */
export function useLanguagePreference() {
  const { selectedOrganizationId } = useOrganization()
  // Leído una sola vez: identidad estable para no recrear callbacks del hook
  // genérico en cada render (ver `remove` en useUserPreference).
  const defaultValueRef = useRef<LanguagePreference | undefined>(undefined)
  if (!defaultValueRef.current) {
    // `i18n.language` suele traer región (es-ES, es-419, en-US) — normalizar
    // con el mismo criterio que `syncDocumentLang` (src/i18n/index.ts), o el
    // default cae siempre a 'en' y pisa el idioma que el navegador ya había
    // resuelto bien.
    defaultValueRef.current = { language: resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language) }
  }

  const { value, setValue } = useUserPreference<LanguagePreference>({
    key: PREF_KEY,
    organizationId: selectedOrganizationId,
    defaultValue: defaultValueRef.current,
    parse: parseLanguage,
  })

  // Aplica el idioma vigente de la preferencia (hidratación inicial o cambio
  // desde otra pestaña/dispositivo) sin esperar a que el usuario interactúe.
  useEffect(() => {
    const active = resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
    if (active !== value.language) {
      i18n.changeLanguage(value.language)
    }
  }, [value.language])

  const setLanguage = (language: LanguagePreference["language"]) => setValue({ language })

  return { language: value.language, setLanguage }
}
