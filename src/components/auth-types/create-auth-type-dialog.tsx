"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { CreateAuthTypeRequest } from "@/services/auth-types"
import { Plus } from "lucide-react"

interface CreateAuthTypeDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function CreateAuthTypeDialog({ open: externalOpen, onOpenChange, children }: CreateAuthTypeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [formData, setFormData] = useState<CreateAuthTypeRequest>({
    name: "",
    type: "internal",
    params: null,
  })

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const { data: authTypeTypes } = useAuthTypeTypes(open)
  const { createAuthType } = useAuthTypeMutations()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    createAuthType.mutate(formData, {
      onSuccess: () => {
        setOpen(false)
        setFormData({
          name: "",
          type: "internal", 
          params: null,
        })
      }
    })
  }

  const handleInputChange = (field: keyof CreateAuthTypeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // If externally controlled, don't render the trigger
  if (externalOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Authentication Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter authentication type name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value as "internal" | "entra")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  {authTypeTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "internal" ? "Internal" : type === "entra" ? "Entra ID (SAML2)" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAuthType.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
              >
                {createAuthType.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Original mode with trigger (for backward compatibility)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Create Authentication Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Authentication Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter authentication type name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value as "internal" | "entra")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                {authTypeTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "internal" ? "Internal" : type === "entra" ? "Entra ID (SAML2)" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAuthType.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
            >
              {createAuthType.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}