import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { useUserMutations } from "@/hooks/useUsers"

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

    if (!formData.birth_day) {
      newErrors.birth_day = 'Birth day is required'
    }

    if (!formData.birth_month) {
      newErrors.birth_month = 'Birth month is required'
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
      birth_day: parseInt(formData.birth_day),
      birth_month: parseInt(formData.birth_month),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive an invitation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter first name"
                className={errors.name ? 'border-destructive' : ''}
                disabled={isLoading}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-destructive' : ''}
                disabled={isLoading}
                required
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className={errors.email ? 'border-destructive' : ''}
                disabled={isLoading}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="birth_day">Birth Day *</Label>
                <Select
                  value={formData.birth_day}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, birth_day: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="birth_day" className={errors.birth_day ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.birth_day && (
                  <p className="text-sm text-destructive">{errors.birth_day}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="birth_month">Birth Month *</Label>
                <Select
                  value={formData.birth_month}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, birth_month: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="birth_month" className={errors.birth_month ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: '1', label: 'January' },
                      { value: '2', label: 'February' },
                      { value: '3', label: 'March' },
                      { value: '4', label: 'April' },
                      { value: '5', label: 'May' },
                      { value: '6', label: 'June' },
                      { value: '7', label: 'July' },
                      { value: '8', label: 'August' },
                      { value: '9', label: 'September' },
                      { value: '10', label: 'October' },
                      { value: '11', label: 'November' },
                      { value: '12', label: 'December' }
                    ].map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.birth_month && (
                  <p className="text-sm text-destructive">{errors.birth_month}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photo_file">Photo (Optional)</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="photo_file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hover:cursor-pointer"
                />
                {selectedFileName && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFileName}
                  </p>
                )}
                {errors.photo_file && (
                  <p className="text-sm text-destructive">{errors.photo_file}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={isLoading}
              className="hover:cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}