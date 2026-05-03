import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { variantOptions } from '@/lib/product/category-templates'

export interface ProductVariant {
  id: string
  type: string // 'ram', 'storage', 'color', 'size'
  value: string
  price?: number
  stock?: number
  sku?: string
}

export interface VariantCombination {
  id: string
  options: Record<string, string> // { ram: '8GB', storage: '256GB', color: 'Black' }
  price: number
  stock: number
  sku: string
}

interface VariantManagerProps {
  onVariantsChange: (combinations: VariantCombination[]) => void
  basePrice: number
  baseSKU: string
}

export function VariantManager({ onVariantsChange, basePrice, baseSKU }: VariantManagerProps) {
  const [variantTypes, setVariantTypes] = useState<Array<{ type: string; values: string[] }>>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [customValue, setCustomValue] = useState<string>('')

  // Add a new variant type
  const addVariantType = (type: string) => {
    if (!variantTypes.find(v => v.type === type)) {
      setVariantTypes([...variantTypes, { type, values: [] }])
    }
  }

  // Add a value to a variant type
  const addVariantValue = (type: string, value: string) => {
    setVariantTypes(prev => 
      prev.map(vt => 
        vt.type === type 
          ? { ...vt, values: [...vt.values, value] }
          : vt
      )
    )
  }

  // Remove a variant type
  const removeVariantType = (type: string) => {
    setVariantTypes(prev => prev.filter(vt => vt.type !== type))
    generateCombinations(variantTypes.filter(vt => vt.type !== type))
  }

  // Remove a value from a variant type
  const removeVariantValue = (type: string, value: string) => {
    const updated = variantTypes.map(vt => 
      vt.type === type 
        ? { ...vt, values: vt.values.filter(v => v !== value) }
        : vt
    )
    setVariantTypes(updated)
    generateCombinations(updated)
  }

  // Generate all combinations of variants
  const generateCombinations = (types: Array<{ type: string; values: string[] }>) => {
    if (types.length === 0 || types.some(t => t.values.length === 0)) {
      onVariantsChange([])
      return
    }

    const combinations: VariantCombination[] = []
    
    // Recursive function to generate combinations
    const generate = (index: number, current: Record<string, string>) => {
      if (index === types.length) {
        const id = Object.values(current).join('-').toLowerCase().replace(/\s+/g, '-')
        const sku = `${baseSKU}-${id}`
        combinations.push({
          id,
          options: { ...current },
          price: basePrice,
          stock: 0,
          sku
        })
        return
      }

      const { type, values } = types[index]
      values.forEach(value => {
        generate(index + 1, { ...current, [type]: value })
      })
    }

    generate(0, {})
    onVariantsChange(combinations)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
        <CardDescription>
          Add variations like RAM, Storage, Color, or Size. Each combination will create a unique product variant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Variant Type */}
        <div className="space-y-2">
          <Label>Add Variant Type</Label>
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ram">RAM</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="color">Color</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="pack">Pack Size</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              type="button"
              onClick={() => {
                if (selectedType) {
                  addVariantType(selectedType)
                  setSelectedType('')
                }
              }}
              disabled={!selectedType}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Type
            </Button>
          </div>
        </div>

        {/* Display Variant Types and Values */}
        {variantTypes.map(({ type, values }) => (
          <div key={type} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold capitalize">{type}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariantType(type)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Add values */}
            <div className="flex gap-2">
              {variantOptions[type as keyof typeof variantOptions] ? (
                <Select 
                  onValueChange={(value) => {
                    if (value && !values.includes(value)) {
                      addVariantValue(type, value)
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={`Select ${type}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variantOptions[type as keyof typeof variantOptions]?.map((option) => (
                      <SelectItem key={option} value={option} disabled={values.includes(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input
                    placeholder={`Enter ${type} value`}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customValue) {
                        e.preventDefault()
                        if (!values.includes(customValue)) {
                          addVariantValue(type, customValue)
                          setCustomValue('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (customValue && !values.includes(customValue)) {
                        addVariantValue(type, customValue)
                        setCustomValue('')
                      }
                    }}
                  >
                    Add
                  </Button>
                </>
              )}
            </div>

            {/* Display selected values */}
            <div className="flex flex-wrap gap-2">
              {values.map((value) => (
                <Badge key={value} variant="secondary" className="gap-1">
                  {value}
                  <button
                    type="button"
                    onClick={() => removeVariantValue(type, value)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {/* Generate button */}
        {variantTypes.length > 0 && (
          <Button
            type="button"
            className="w-full"
            onClick={() => generateCombinations(variantTypes)}
          >
            Generate Variants ({variantTypes.reduce((acc, vt) => acc * (vt.values.length || 1), 1)} combinations)
          </Button>
        )}

        {/* Info */}
        {variantTypes.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
            Add variant types above to create product variations
          </div>
        )}
      </CardContent>
    </Card>
  )
}
