import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { updateUser, getUserById } from "@/services/users"
import { type User, type UpdateUserData } from "@/types/users"
import { userQueryKeys } from "@/hooks/useUsers"
import { toast } from "sonner"
import { Loader2, UserPen } from "lucide-react"
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
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const queryClient = useQueryClient()

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
      // Show current photo filename if exists
      if (fetchedUser.photo_url) {
        const fileName = fetchedUser.photo_url.split('/').pop() || 'Current photo'
        setSelectedFileName(fileName)
      } else {
        setSelectedFileName('')
      }
    }
  }, [fetchedUser, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo_file: 'Please select an image file' }))
        return
      }

      setErrors(prev => {
        const { photo_file, ...rest } = prev
        return rest
      })

      setSelectedFileName(file.name)

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
      toast.success('User updated successfully')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (user) {
      const updateData: UpdateUserData = {
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        ...(formData.birth_day && { birth_day: parseInt(formData.birth_day) }),
        ...(formData.birth_month && { birth_month: parseInt(formData.birth_month) }),
        ...(formData.photo_file && { photo_file: formData.photo_file })
      }
      
      updateUserMutation.mutate({ userId: user.id, data: updateData })
    }
  }

  if (!user) return null

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User"
      description="Update user information. Changes will be saved when you click save."
      icon={UserPen}
      maxWidth="lg"
      maxHeight="90vh"
      formId="edit-user-form"
      submitLabel="Save Changes"
      isSubmitting={updateUserMutation.isPending}
      isValid={!!formData.name.trim() && !!formData.last_name.trim() && !!formData.email.trim()}
      showDefaultFooter
    >
      {isLoadingUser ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading user data...</span>
        </div>
      ) : (
        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
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
            selectedFileName={selectedFileName}
            emailReadOnly={true}
          />
        </form>
      )}
    </ReusableDialog>
  )
}
