"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/shared/utils"
import { Button } from "@/shared/ui/atoms/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/atoms/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/atoms/popover"

export interface ComboboxOption {
  value: string | number
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | number
  onSelect: (value: string | number) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  allowCustomValue?: boolean
  onSearchChange?: (value: string) => void
}

export function Combobox({
  options = [],
  value,
  onSelect,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  loading = false,
  allowCustomValue = false,
  onSearchChange
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Find the selected label
  const selectedLabel = React.useMemo(() => {
    if (value === undefined || value === null || value === "") return undefined
    const option = options.find((option) => String(option.value) === String(value))
    return option ? option.label : String(value) // Return value itself if it's a custom value
  }, [value, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue} 
            onValueChange={(val) => {
              setSearchValue(val)
              onSearchChange?.(val)
            }} 
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue && searchValue ? (
                <button
                  className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => {
                    onSelect(searchValue)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  Use custom value: "{searchValue}"
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onSelect(option.value)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
