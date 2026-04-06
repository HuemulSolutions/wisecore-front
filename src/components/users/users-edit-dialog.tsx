import React, { useState } from "react"
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { updateUser, getUserById } from "@/services/users"
import { type User, type UpdateUserData } from "@/types/users"
import { userQueryKeys } from "@/hooks/useUsers"
import { toast } from "sonner"
import { UserPen } from "lucide-react"
import UserFormFields from "@/components/users/users-form-fields"

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    birth_day: '',
    birth_month: '',
    photo_file: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { t } = useTranslation(['users'])

  // Fetch user data when dialog opens
  const { data: fetchedUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => getUserById(user!.id),
    enabled: !!user?.id && open,
    staleTime: 0, // Always fetch fresh data when dialog opens
  })

  // Reset form when user data is fetched
  React.useEffect(() => {
    if (fetchedUser && open) {
      // Use birth_day and birth_month directly from the API response
      const birthDay = fetchedUser.birth_day ? fetchedUser.birth_day.toString() : ''
      const birthMonth = fetchedUser.birth_month ? fetchedUser.birth_month.toString() : ''
      
      setFormData({
        name: fetchedUser.name || '',
        last_name: fetchedUser.last_name || '',
        email: fetchedUser.email || '',
        birth_day: birthDay,
        birth_month: birthMonth,
        photo_file: ''
      })
      setErrors({})
    }
  }, [fetchedUser, open])

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

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
    onSuccess: (_, variables) => {
      // Invalidate the users list query
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      // Invalidate the specific user query
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.userId) })
      // Also invalidate the query used by this dialog
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      toast.success(t('users:toast.userUpdated'))
    },
  })

  const handleSave = async () => {
    if (!validateForm()) throw new Error('Validation failed')
    if (!user) return

    const updateData: UpdateUserData = {
      name: formData.name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      ...(formData.birth_day && { birth_day: parseInt(formData.birth_day) }),
      ...(formData.birth_month && { birth_month: parseInt(formData.birth_month) }),
      ...(formData.photo_file && { photo_file: formData.photo_file })
    }

    await new Promise<void>((resolve, reject) => {
      updateUserMutation.mutate({ userId: user.id, data: updateData }, {
        onSuccess: () => { onSuccess?.(); resolve() },
        onError: (e) => reject(e)
      })
    })
  }

  if (!user) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users:edit.title')}
      description={t('users:edit.description')}
      icon={UserPen}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      bodyLoading={isLoadingUser}
      saveAction={{
        label: t('users:edit.button'),
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
          disabled={updateUserMutation.isPending}
          errors={errors}
          emailReadOnly={true}
        />
      </div>
    </HuemulDialog>
  )
}
