"use client"

import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { AuthType, UpdateAuthTypeRequest } from "@/services/auth-types"
import { Edit } from "lucide-react"

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

  const { data: authTypeTypes } = useAuthTypeTypes(open && !!authType)
  const { updateAuthType } = useAuthTypeMutations()

  useEffect(() => {
    if (authType && open) {
      setFormData({
        name: authType.name,
        type: authType.type,
        params: authType.params,
      })
    }
  }, [authType, open])

  const handleSubmit = () => {
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
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Authentication Type"
      icon={Edit}
      maxWidth="sm"
      maxHeight="90vh"
      onSubmit={handleSubmit}
      submitLabel="Update"
      isSubmitting={updateAuthType.isPending}
      showDefaultFooter
    >
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
    </ReusableDialog>
  )
}