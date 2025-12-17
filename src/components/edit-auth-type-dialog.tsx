"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { AuthType, UpdateAuthTypeRequest } from "@/services/auth-types"

interface EditAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export function EditAuthTypeDialog({ open, onOpenChange, authType }: EditAuthTypeDialogProps) {
  const [formData, setFormData] = useState<UpdateAuthTypeRequest>({
    name: "",
    type: "internal",
    params: null,
  })

  const { data: authTypeTypes } = useAuthTypeTypes()
  const { updateAuthType } = useAuthTypeMutations()

  useEffect(() => {
    if (authType) {
      setFormData({
        name: authType.name,
        type: authType.type,
        params: authType.params,
      })
    }
  }, [authType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authType) return

    updateAuthType.mutate({ id: authType.id, data: formData }, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  const handleInputChange = (field: keyof UpdateAuthTypeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Authentication Type</DialogTitle>
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
              <SelectTrigger>
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
              onClick={() => onOpenChange(false)}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateAuthType.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
            >
              {updateAuthType.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}