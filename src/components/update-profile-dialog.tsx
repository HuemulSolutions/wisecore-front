"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ChevronDownIcon, Edit3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/services/auth"
import { toast } from "sonner"

interface UpdateUserRequest {
  name: string;
  last_name: string;
  birthdate?: string;
}

interface UpdateProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateProfileDialog({ open, onOpenChange }: UpdateProfileDialogProps) {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [lastName, setLastName] = useState(user?.last_name || "")
  const [birthdate, setBirthdate] = useState<Date | undefined>(
    user?.birthdate ? new Date(user.birthdate) : undefined
  )
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  React.useEffect(() => {
    if (user) {
      setName(user.name || "")
      setLastName(user.last_name || "")
      setBirthdate(user.birthdate ? new Date(user.birthdate) : undefined)
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      if (!user?.id) throw new Error("User ID not found")
      return authService.updateUser(user.id, data)
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success("Profile updated successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Update profile error:", error)
      toast.error("Failed to update profile")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updateData: UpdateUserRequest = {
      name: name.trim(),
      last_name: lastName.trim(),
    }
    
    if (birthdate) {
      updateData.birthdate = birthdate.toISOString()
    }

    updateProfileMutation.mutate(updateData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                Update Profile
            </DialogTitle>
          <DialogDescription>
            Make changes to your profile information here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthdate">Date of Birth (Optional)</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    id="birthdate"
                    className="w-full justify-between font-normal"
                  >
                    {birthdate ? birthdate.toLocaleDateString() : "Select date"}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthdate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      setBirthdate(date)
                      setDatePickerOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter className="mt-8 gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="hover:cursor-pointer"
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}