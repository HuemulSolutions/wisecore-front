import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDownIcon, UserPlus } from "lucide-react"
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
    birthdate: undefined as Date | undefined
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const { createUser } = useUserMutations()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        last_name: '',
        email: '',
        birthdate: undefined
      })
      setErrors({})
      setDatePickerOpen(false)
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

    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      birthdate: formData.birthdate ? formData.birthdate.toISOString() : ''
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

            <div className="grid gap-2">
              <Label htmlFor="birthdate">Date of Birth *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    id="birthdate"
                    className={`w-full justify-between font-normal ${errors.birthdate ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  >
                    {formData.birthdate ? formData.birthdate.toLocaleDateString() : "Select date"}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.birthdate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, birthdate: date }))
                      setDatePickerOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.birthdate && (
                <p className="text-sm text-destructive">{errors.birthdate}</p>
              )}
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