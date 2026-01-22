import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface UserFormFieldsProps {
  name: string
  lastName: string
  email: string
  birthDay?: string
  birthMonth?: string
  onNameChange: (name: string) => void
  onLastNameChange: (lastName: string) => void
  onEmailChange: (email: string) => void
  onBirthDayChange?: (day: string) => void
  onBirthMonthChange?: (month: string) => void
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  includeBirthday?: boolean
  includePhoto?: boolean
  disabled?: boolean
  errors?: Record<string, string>
  selectedFileName?: string
  emailReadOnly?: boolean
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
]

const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1)
}))

export default function UserFormFields({
  name,
  lastName,
  email,
  birthDay = '',
  birthMonth = '',
  onNameChange,
  onLastNameChange,
  onEmailChange,
  onBirthDayChange,
  onBirthMonthChange,
  onFileChange,
  includeBirthday = false,
  includePhoto = false,
  disabled = false,
  errors = {},
  selectedFileName = '',
  emailReadOnly = false
}: UserFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">First Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter first name"
          required
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="last_name">Last Name *</Label>
        <Input
          id="last_name"
          name="last_name"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          placeholder="Enter last name"
          required
          disabled={disabled}
        />
        {errors.last_name && (
          <p className="text-xs text-red-600">{errors.last_name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="user@example.com"
          required
          disabled={disabled}
          readOnly={emailReadOnly}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {includeBirthday && onBirthDayChange && onBirthMonthChange && (
        <div className="grid gap-2">
          <Label>Birthday (Optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={birthMonth}
              onValueChange={onBirthMonthChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={birthDay}
              onValueChange={onBirthDayChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {includePhoto && onFileChange && (
        <div className="grid gap-2">
          <Label htmlFor="photo_file">Profile Photo (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="photo_file"
              name="photo_file"
              type="file"
              onChange={onFileChange}
              accept="image/*"
              disabled={disabled}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('photo_file')?.click()}
              disabled={disabled}
              className="hover:cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFileName || 'Choose File'}
            </Button>
            {selectedFileName && (
              <span className="text-xs text-muted-foreground truncate">
                {selectedFileName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Accepted formats: JPG, PNG, GIF (Max 5MB)
          </p>
        </div>
      )}
    </div>
  )
}
