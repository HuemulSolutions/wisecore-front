"use client"

import * as React from "react"
import { Pipette } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  label?: string
  className?: string
}

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
]

export function ColorPicker({ value = "#000000", onChange, label, className }: ColorPickerProps) {
  const [color, setColor] = React.useState(value)
  const [inputValue, setInputValue] = React.useState(value)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setColor(value)
    setInputValue(value)
  }, [value])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setInputValue(newColor)
    onChange?.(newColor)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      setColor(newValue)
      onChange?.(newValue)
    }
  }

  const handleInputBlur = () => {
    // If invalid hex, reset to last valid color
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(color)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#000000"
            className="pr-10 font-mono uppercase"
            maxLength={7}
          />
          <div
            className="absolute right-2 top-1/2 size-6 -translate-y-1/2 rounded border-2 border-border"
            style={{ backgroundColor: color }}
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              aria-label="Abrir selector de color"
            >
              <Pipette className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Selecciona un color</p>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      className={cn(
                        "size-8 rounded border-2 transition-all hover:scale-110",
                        color.toLowerCase() === presetColor.toLowerCase()
                          ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
                          : "border-border",
                      )}
                      style={{ backgroundColor: presetColor }}
                      onClick={() => {
                        handleColorChange(presetColor)
                        setIsOpen(false)
                      }}
                      aria-label={presetColor}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Color personalizado</p>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="size-10 cursor-pointer rounded border border-input"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        handleColorChange(val.padEnd(7, "0"))
                      }
                    }}
                    className="flex-1 font-mono uppercase"
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
