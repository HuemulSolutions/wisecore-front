import { useTranslation } from "react-i18next"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"

export function RolesAccessDenied() {
  const { t } = useTranslation(['roles', 'common'])
  return <HuemulAccessDenied description={t('roles:accessDenied.description')} />
}
