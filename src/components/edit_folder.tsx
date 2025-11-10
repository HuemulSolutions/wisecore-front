"use client"

import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
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
}

export default function EditFolder({ 
  trigger, 
  folderId, 
  currentName,
  onFolderEdited 
}: EditFolderProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Reset name when currentName changes
  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Folder name cannot be empty")
      return
    }

    if (name.trim() === currentName) {
      toast.info("No changes made")
      setIsOpen(false)
      return
    }

    setIsSubmitting(true)
    
    try {
      await editFolder(folderId, name.trim())
      toast.success(`Folder renamed to "${name.trim()}"`)
      onFolderEdited?.()
      setIsOpen(false)
    } catch (error) {
      console.error('Error editing folder:', error)
      toast.error("Failed to rename folder. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDialog = () => {
    setName(currentName)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setName(currentName) // Reset to original name
  }

  // Handle click with proper event handling for menu items
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTimeout(() => {
      openDialog()
    }, 10)
  }

  return (
    <>
      {/* Trigger element */}
      <div onClick={handleTriggerClick}>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="hover:cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Folder
          </Button>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Change the name of the folder "{currentName}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter folder name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                className="hover:cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim()}
              className="hover:cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}