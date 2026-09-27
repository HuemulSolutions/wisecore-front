import { useTranslation } from "react-i18next"
import { termsUrl, privacyUrl } from "@/config"
import { FieldDescription } from "@/components/ui/field"
import packageJson from "../../../package.json"

/**
 * Pie legal compartido por LoginForm y OTPForm. Los enlaces de Términos y
 * Privacidad solo se renderizan como <a> si hay URL configurada — un
 * href="#" que scrollea al tope es peor que texto plano sin enlace.
 */
export function AuthLegalFooter() {
  const { t } = useTranslation('auth')

  return (
    <>
      <FieldDescription className="px-6 text-center text-sm text-gray-500">
        {t('login.termsText')}{" "}
        {termsUrl ? (
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4464f7] hover:text-[#3451e6] hover:underline"
          >
            {t('login.termsOfService')}
          </a>
        ) : (
          t('login.termsOfService')
        )}{" "}
        {t('login.and')}{" "}
        {privacyUrl ? (
          <a
            href={privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4464f7] hover:text-[#3451e6] hover:underline"
          >
            {t('login.privacyPolicy')}
          </a>
        ) : (
          t('login.privacyPolicy')
        )}
        .
      </FieldDescription>
      <div className="text-center text-xs text-gray-400">
        {t('login.version')} {packageJson.version}
      </div>
    </>
  )
}
