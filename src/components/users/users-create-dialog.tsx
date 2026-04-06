import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { UserPlus } from "lucide-react"
import { useUserMutations } from "@/hooks/useUsers"
import UserFormFields from "@/components/users/users-form-fields"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  addToOrganization?: boolean
}

export default function CreateUserDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  addToOrganization
}: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    birth_day: '',
    birth_month: '',
    photo_file: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createUser } = useUserMutations()
  const { t } = useTranslation(['users'])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        last_name: '',
        email: '',
        birth_day: '',
        birth_month: '',
        photo_file: ''
      })
      setErrors({})
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('users:validation.nameRequired')
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('users:validation.lastNameRequired')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('users:validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users:validation.emailInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo_file: t('users:validation.invalidImageFile') }))
        return
      }
      setErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { photo_file: _, ...rest } = prev
        return rest
      })
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData(prev => ({ ...prev, photo_file: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) throw new Error('Validation failed')

    const submissionData = {
      name: formData.name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      ...(formData.birth_day && { birth_day: parseInt(formData.birth_day) }),
      ...(formData.birth_month && { birth_month: parseInt(formData.birth_month) }),
      ...(formData.photo_file && { photo_file: formData.photo_file }),
      ...(addToOrganization === false && { add_to_organization: false })
    }

    await new Promise<void>((resolve, reject) => {
      createUser.mutate(submissionData, {
        onSuccess: () => { onSuccess?.(); resolve() },
        onError: (e) => reject(e)
      })
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users:create.title')}
      description={t('users:create.description')}
      icon={UserPlus}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: t('users:create.button'),
        onClick: handleSave,
        disabled: !formData.name.trim() || !formData.last_name.trim() || !formData.email.trim()
      }}
    >
      <div className="space-y-4">
        <UserFormFields
          name={formData.name}
          lastName={formData.last_name}
          email={formData.email}
          birthDay={formData.birth_day}
          birthMonth={formData.birth_month}
          onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
          onLastNameChange={(last_name) => setFormData(prev => ({ ...prev, last_name }))}
          onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
          onBirthDayChange={(birth_day) => setFormData(prev => ({ ...prev, birth_day }))}
          onBirthMonthChange={(birth_month) => setFormData(prev => ({ ...prev, birth_month }))}
          onFileChange={handleFileChange}
          includeBirthday={true}
          includePhoto={true}
          disabled={createUser.isPending}
          errors={errors}
        />
      </div>
    </HuemulDialog>
  )
}
