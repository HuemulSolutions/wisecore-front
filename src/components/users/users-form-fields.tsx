import { useTranslation } from 'react-i18next'
import { HuemulField } from "@/huemul/components/huemul-field"

interface UserFormFieldsProps {
  name: string
  lastName: string
  email: string
  birthDay?: string
  birthMonth?: string
  onNameChange: (name: string) => void
  onLastNameChange: (lastName: string) => void
  onEmailChange: (email: string) => void
  onBirthDayChange?: (day: string) => void
  onBirthMonthChange?: (month: string) => void
  onFileChange?: (files: FileList | null) => void
  includeBirthday?: boolean
  includePhoto?: boolean
  disabled?: boolean
  errors?: Record<string, string>
  emailReadOnly?: boolean
}

const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1)
}))

export default function UserFormFields({
  name,
  lastName,
  email,
  birthDay = '',
  birthMonth = '',
  onNameChange,
  onLastNameChange,
  onEmailChange,
  onBirthDayChange,
  onBirthMonthChange,
  onFileChange,
  includeBirthday = false,
  includePhoto = false,
  disabled = false,
  errors = {},
  emailReadOnly = false
}: UserFormFieldsProps) {
  const { t } = useTranslation(['users'])

  const months = [
    { value: "1", label: t('users:form.months.january') },
    { value: "2", label: t('users:form.months.february') },
    { value: "3", label: t('users:form.months.march') },
    { value: "4", label: t('users:form.months.april') },
    { value: "5", label: t('users:form.months.may') },
    { value: "6", label: t('users:form.months.june') },
    { value: "7", label: t('users:form.months.july') },
    { value: "8", label: t('users:form.months.august') },
    { value: "9", label: t('users:form.months.september') },
    { value: "10", label: t('users:form.months.october') },
    { value: "11", label: t('users:form.months.november') },
    { value: "12", label: t('users:form.months.december') },
  ]

  return (
    <div className="grid gap-4">
      <HuemulField
        type="text"
        label={t('users:form.firstName')}
        name="name"
        value={name}
        onChange={(v) => onNameChange(String(v))}
        placeholder={t('users:form.firstNamePlaceholder')}
        required
        disabled={disabled}
        error={errors.name}
      />

      <HuemulField
        type="text"
        label={t('users:form.lastName')}
        name="last_name"
        value={lastName}
        onChange={(v) => onLastNameChange(String(v))}
        placeholder={t('users:form.lastNamePlaceholder')}
        required
        disabled={disabled}
        error={errors.last_name}
      />

      <HuemulField
        type="email"
        label={t('common:email')}
        name="email"
        value={email}
        onChange={(v) => onEmailChange(String(v))}
        placeholder={t('users:form.emailPlaceholder')}
        required
        disabled={disabled}
        readOnly={emailReadOnly}
        error={errors.email}
      />

      {includeBirthday && onBirthDayChange && onBirthMonthChange && (
        <div className="grid grid-cols-2 gap-2">
          <HuemulField
            type="select"
            label={t('users:form.birthMonth')}
            name="birth_month"
            value={birthMonth}
            onChange={(v) => onBirthMonthChange(String(v))}
            placeholder={t('users:form.birthMonthPlaceholder')}
            options={months}
            disabled={disabled}
          />
          <HuemulField
            type="select"
            label={t('users:form.birthDay')}
            name="birth_day"
            value={birthDay}
            onChange={(v) => onBirthDayChange(String(v))}
            placeholder={t('users:form.birthDayPlaceholder')}
            options={days}
            disabled={disabled}
          />
        </div>
      )}

      {includePhoto && onFileChange && (
        <HuemulField
          type="file"
          label={t('users:form.profilePhoto')}
          name="photo_file"
          accept="image/*"
          disabled={disabled}
          onFileChange={onFileChange}
          description={t('users:form.profilePhotoDescription')}
          error={errors.photo_file}
        />
      )}
    </div>
  )
}
