import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { UserPlus } from "lucide-react"
import { useUserMutations } from "@/hooks/useUsers"
import UserFormFields from "@/components/users/users-form-fields"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateUserDialog({ 
  open, 
  onOpenChange 
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
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const { createUser } = useUserMutations()

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
      setSelectedFileName('')
    }
  }, [open])

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo_file: 'Please select an image file' }))
        return
      }

      // Clear previous error
      setErrors(prev => {
        const { photo_file, ...rest } = prev
        return rest
      })

      setSelectedFileName(file.name)

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData(prev => ({ ...prev, photo_file: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submissionData = {
      name: formData.name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      ...(formData.birth_day && { birth_day: parseInt(formData.birth_day) }),
      ...(formData.birth_month && { birth_month: parseInt(formData.birth_month) }),
      ...(formData.photo_file && { photo_file: formData.photo_file })
    }

    createUser.mutate(submissionData, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  const isLoading = createUser.isPending

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New User"
      description="Add a new user to the system. They will receive an invitation email."
      icon={UserPlus}
      maxWidth="lg"
      formId="create-user-form"
      submitLabel="Create User"
      isSubmitting={isLoading}
      isValid={!!formData.name.trim() && !!formData.last_name.trim() && !!formData.email.trim()}
      showDefaultFooter
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
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
          disabled={isLoading}
          errors={errors}
          selectedFileName={selectedFileName}
        />
        </form>
    </ReusableDialog>
  )
}