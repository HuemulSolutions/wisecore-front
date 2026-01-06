"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { createFolder } from "@/services/folders"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "sonner"

interface CreateFolderRequest {
  name: string;
  organization_id: string;
  parent_folder_id?: string;
}

interface CreateFolderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentFolder?: string;
  onFolderCreated?: () => void;
}

export function CreateFolderDialog({ open, onOpenChange, parentFolder, onFolderCreated }: CreateFolderProps) {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const [name, setName] = useState("")

  React.useEffect(() => {
    if (open) {
      setName("")
    }
  }, [open])

  const createFolderMutation = useMutation({
    mutationFn: async (data: CreateFolderRequest) => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      return createFolder(data.name, data.organization_id, data.parent_folder_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", selectedOrganizationId] })
      onFolderCreated?.()
      toast.success("Folder created successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Create folder error:", error)
      toast.error("Failed to create folder")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOrganizationId) {
      toast.error("Organization is required")
      return
    }

    const folderData: CreateFolderRequest = {
      name: name.trim(),
      organization_id: selectedOrganizationId,
    }
    
    if (parentFolder) {
      folderData.parent_folder_id = parentFolder
    }

    createFolderMutation.mutate(folderData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Folder
          </DialogTitle>
          <DialogDescription>
            Enter the folder name to create a new folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name *</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                required
              />
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
              disabled={createFolderMutation.isPending || !name.trim() || !selectedOrganizationId}
              className="hover:cursor-pointer"
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Legacy wrapper component for backward compatibility
interface CreateFolderLegacyProps {
  trigger: React.ReactNode;
  parentFolder?: string;
  onFolderCreated?: () => void;
}

export default function CreateFolder({ trigger, parentFolder, onFolderCreated }: CreateFolderLegacyProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <CreateFolderDialog
        open={open}
        onOpenChange={setOpen}
        parentFolder={parentFolder}
        onFolderCreated={onFolderCreated}
      />
    </>
  )
}