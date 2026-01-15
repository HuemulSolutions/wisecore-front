import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface RoleFormFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  includeTextarea?: boolean
}

export default function RoleFormFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameLabel = "Role Name *",
  descriptionLabel = "Description *",
  includeTextarea = true
}: RoleFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">{nameLabel}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter role name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">{descriptionLabel}</Label>
        {includeTextarea ? (
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter role description"
            rows={3}
            required
          />
        ) : (
          <Input
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter role description"
          />
        )}
      </div>
    </div>
  )
}
