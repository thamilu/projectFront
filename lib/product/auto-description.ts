/**
 * Auto-generate product description based on filled form data
 */

import { getCategoryTemplate } from './category-templates'

export interface ProductData {
  name?: string
  categoryName?: string
  subCategoryName?: string
  brandName?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export function generateProductDescription(data: ProductData): string {
  const template = getCategoryTemplate(data.categoryName || '', data.subCategoryName)
  
  // If template has a custom generator, use it
  if (template.autoDescriptionTemplate) {
    const customDesc = template.autoDescriptionTemplate(data)
    if (customDesc) return customDesc
  }
  
  // Fallback: generic description builder
  const parts: string[] = []
  
  // Add product name intro
  if (data.name) {
    parts.push(`Introducing the ${data.name}.`)
  }
  
  // Add brand if available
  if (data.brandName) {
    parts.push(`Crafted by ${data.brandName}.`)
  }
  
  // Add category-specific details
  if (data.material) parts.push(`Made from premium ${data.material}.`)
  if (data.display) parts.push(`Features a stunning ${data.display} display.`)
  if (data.processor) parts.push(`Powered by ${data.processor} processor.`)
  if (data.ram && data.storage) parts.push(`Equipped with ${data.ram} RAM and ${data.storage} storage.`)
  if (data.camera) parts.push(`Capture amazing moments with ${data.camera} camera.`)
  if (data.battery) parts.push(`Long-lasting ${data.battery} battery.`)
  
  // Add warranty if available
  if (data.warrantyPeriod && data.warrantyUnit) {
    parts.push(`Comes with ${data.warrantyPeriod} ${data.warrantyUnit.toString().toLowerCase()} warranty.`)
  }
  
  // Join all parts
  return parts.join(' ')
}

/**
 * Generate smart placeholder text for description based on category
 */
export function getDescriptionPlaceholder(categoryName?: string, subCategoryName?: string): string {
  const template = getCategoryTemplate(categoryName || '', subCategoryName)
  
  const placeholders: Record<string, string> = {
    smartphones: 'Describe display, processor, RAM, storage, camera, battery, and special features...',
    laptops: 'Describe display, processor, RAM, storage, graphics card, battery life, and use cases...',
    clothing: 'Describe material, fit, pattern, occasion, care instructions, and style...',
    grocery: 'Describe ingredients, weight, nutritional info, storage instructions, and use cases...',
    books: 'Describe the plot, themes, author background, and target audience...',
  }
  
  const key = template.name.toLowerCase().replace(/\s+/g, '')
  return placeholders[key] || 'Describe the product features, benefits, and specifications...'
}
