import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUser, getUserById, type User, type UpdateUserData } from "@/services/users"
import { userQueryKeys } from "@/hooks/useUsers"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
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
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      // Invalidate the specific user query
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.userId) })
      // Also invalidate the query used by this dialog
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      toast.success('User updated successfully')
      onOpenChange(false)
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
      // Create birthdate from birth_day and birth_month if provided
      let birthdateValue = undefined
      if (formData.birth_day && formData.birth_month) {
        const year = new Date().getFullYear()
        const date = new Date(year, parseInt(formData.birth_month) - 1, parseInt(formData.birth_day))
        birthdateValue = date.toISOString()
      }
      
      const updateData: UpdateUserData = {
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        birthdate: birthdateValue
      }
      
      updateUserMutation.mutate({ userId: user.id, data: updateData })
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved when you click save.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading user data...</span>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter first name"
                className={errors.name ? 'border-destructive' : ''}
                disabled={updateUserMutation.isPending}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-destructive' : ''}
                disabled={updateUserMutation.isPending}
                required
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className={errors.email ? 'border-destructive' : ''}
              disabled={updateUserMutation.isPending}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_day">Birth Day</Label>
              <Select
                value={formData.birth_day}
                onValueChange={(value) => setFormData(prev => ({ ...prev, birth_day: value }))}
                disabled={updateUserMutation.isPending}
              >
                <SelectTrigger id="birth_day">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_month">Birth Month</Label>
              <Select
                value={formData.birth_month}
                onValueChange={(value) => setFormData(prev => ({ ...prev, birth_month: value }))}
                disabled={updateUserMutation.isPending}
              >
                <SelectTrigger id="birth_month">
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_file">Photo (Optional)</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="photo_file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={updateUserMutation.isPending}
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
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="hover:cursor-pointer"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}