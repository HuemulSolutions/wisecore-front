"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Edit3 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { editFolder } from "@/services/library"
import { toast } from "sonner"

interface EditFolderProps {
  trigger?: React.ReactNode
  folderId: string
  currentName: string
  onFolderEdited?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditFolder({ 
  folderId, 
  currentName,
  onFolderEdited,
  open,
  onOpenChange
}: EditFolderProps) {
  const [name, setName] = useState(currentName)

  // Reset name when currentName changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [currentName, open])

  const editFolderMutation = useMutation({
    mutationFn: async (newName: string) => {
      return await editFolder(folderId, newName.trim())
    },
    onSuccess: () => {
      toast.success(`Folder renamed to "${name.trim()}"`)
      onFolderEdited?.()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error editing folder:', error)
      toast.error("Failed to rename folder. Please try again.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Folder name cannot be empty")
      return
    }

    if (name.trim() === currentName) {
      toast.info("No changes made")
      onOpenChange(false)
      return
    }

    editFolderMutation.mutate(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Folder
          </DialogTitle>
          <DialogDescription>
            Change the name of the folder "{currentName}".
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
                disabled={editFolderMutation.isPending}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-8 gap-3">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                disabled={editFolderMutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={editFolderMutation.isPending || !name.trim()}
              className="hover:cursor-pointer"
            >
              {editFolderMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}