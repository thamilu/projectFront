/**
 * Category-specific field templates for product creation
 * Each category has its own set of required/optional fields and variant options
 */

export interface CategoryTemplate {
  name: string
  fields: string[]
  variants?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoDescriptionTemplate?: (data: any) => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults?: Record<string, any>
}

export const categoryTemplates: Record<string, CategoryTemplate> = {
  // Electronics - Smartphones
  smartphones: {
    name: 'Smartphones',
    fields: ['display', 'processor', 'ram', 'storage', 'camera', 'battery', 'os', 'network'],
    variants: ['ram', 'storage', 'color'],
    autoDescriptionTemplate: (data) => {
      const parts = []
      if (data.display) parts.push(`${data.display} display`)
      if (data.processor) parts.push(`Powered by ${data.processor}`)
      if (data.ram && data.storage) parts.push(`${data.ram} RAM with ${data.storage} storage`)
      if (data.camera) parts.push(`${data.camera} camera system`)
      if (data.battery) parts.push(`${data.battery} battery`)
      if (data.os) parts.push(`Runs on ${data.os}`)
      return parts.join('. ') + '.'
    },
    defaults: {
      warrantyPeriod: 12,
      warrantyUnit: 'MONTHS',
      taxPercentage: 18,
    }
  },

  // Electronics - Laptops
  laptops: {
    name: 'Laptops',
    fields: ['display', 'processor', 'ram', 'storage', 'graphics', 'battery', 'os', 'weight'],
    variants: ['ram', 'storage', 'color'],
    autoDescriptionTemplate: (data) => {
      const parts = []
      if (data.display) parts.push(`${data.display} display`)
      if (data.processor) parts.push(`${data.processor} processor`)
      if (data.ram && data.storage) parts.push(`${data.ram} RAM, ${data.storage} storage`)
      if (data.graphics) parts.push(`${data.graphics} graphics`)
      if (data.os) parts.push(`${data.os} operating system`)
      if (data.weight) parts.push(`Weighs ${data.weight}`)
      return parts.join('. ') + '.'
    },
    defaults: {
      warrantyPeriod: 12,
      warrantyUnit: 'MONTHS',
      taxPercentage: 18,
    }
  },

  // Fashion - Clothing
  clothing: {
    name: 'Clothing',
    fields: ['material', 'fit', 'pattern', 'occasion', 'careInstructions', 'sleeveLength'],
    variants: ['size', 'color'],
    autoDescriptionTemplate: (data) => {
      const parts = []
      if (data.material) parts.push(`Made from ${data.material}`)
      if (data.fit) parts.push(`${data.fit} fit`)
      if (data.pattern) parts.push(`${data.pattern} pattern`)
      if (data.occasion) parts.push(`Perfect for ${data.occasion}`)
      if (data.careInstructions) parts.push(`Care: ${data.careInstructions}`)
      return parts.join('. ') + '.'
    },
    defaults: {
      warrantyPeriod: 7,
      warrantyUnit: 'DAYS',
      taxPercentage: 12,
    }
  },

  // Grocery - Food Items
  grocery: {
    name: 'Grocery & Food',
    fields: ['weight', 'expiryDate', 'ingredients', 'nutritionalInfo', 'fssaiNumber', 'storageInstructions'],
    variants: ['weight', 'pack'],
    autoDescriptionTemplate: (data) => {
      const parts = []
      if (data.weight) parts.push(`Net weight: ${data.weight}`)
      if (data.ingredients) parts.push(`Ingredients: ${data.ingredients}`)
      if (data.nutritionalInfo) parts.push(`${data.nutritionalInfo}`)
      if (data.storageInstructions) parts.push(`Storage: ${data.storageInstructions}`)
      return parts.join('. ') + '.'
    },
    defaults: {
      taxPercentage: 5,
      returnPolicy: 'Non-returnable due to hygiene reasons',
    }
  },

  // Books
  books: {
    name: 'Books',
    fields: ['author', 'publisher', 'isbn', 'pages', 'language', 'edition', 'publicationYear', 'binding'],
    variants: ['format'], // Hardcover, Paperback, eBook
    autoDescriptionTemplate: (data) => {
      const parts = []
      if (data.author) parts.push(`by ${data.author}`)
      if (data.publisher) parts.push(`Published by ${data.publisher}`)
      if (data.pages) parts.push(`${data.pages} pages`)
      if (data.language) parts.push(`Language: ${data.language}`)
      if (data.isbn) parts.push(`ISBN: ${data.isbn}`)
      return parts.join('. ') + '.'
    },
    defaults: {
      taxPercentage: 0, // Books are tax-free in many regions
      warrantyPeriod: 7,
      warrantyUnit: 'DAYS',
    }
  },

  // Default template for other categories
  default: {
    name: 'General Product',
    fields: [],
    variants: [],
    autoDescriptionTemplate: (data) => {
      return data.description || ''
    },
    defaults: {
      warrantyPeriod: 7,
      warrantyUnit: 'DAYS',
      taxPercentage: 18,
    }
  }
}

/**
 * Get template based on category/sub-category name
 */
export function getCategoryTemplate(categoryName: string, subCategoryName?: string): CategoryTemplate {
  const searchName = (subCategoryName || categoryName).toLowerCase()
  
  // Try to match sub-category first
  if (searchName.includes('smartphone') || searchName.includes('mobile')) {
    return categoryTemplates.smartphones
  }
  if (searchName.includes('laptop') || searchName.includes('notebook')) {
    return categoryTemplates.laptops
  }
  if (searchName.includes('clothing') || searchName.includes('apparel') || searchName.includes('shirt') || searchName.includes('dress')) {
    return categoryTemplates.clothing
  }
  if (searchName.includes('grocery') || searchName.includes('food') || searchName.includes('fruit') || searchName.includes('vegetable')) {
    return categoryTemplates.grocery
  }
  if (searchName.includes('book')) {
    return categoryTemplates.books
  }
  
  return categoryTemplates.default
}

/**
 * Common variant options
 */
export const variantOptions = {
  ram: ['4GB', '6GB', '8GB', '12GB', '16GB', '32GB'],
  storage: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  color: ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Gold', 'Rose Gold', 'Purple'],
  size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  weight: ['250g', '500g', '1kg', '2kg', '5kg'],
  pack: ['Single', 'Pack of 2', 'Pack of 3', 'Pack of 6', 'Pack of 12'],
  format: ['Hardcover', 'Paperback', 'eBook', 'Audiobook'],
}

/**
 * Field labels and help text
 */
export const fieldMetadata: Record<string, { label: string; help: string; placeholder: string }> = {
  display: {
    label: 'Display',
    help: 'Screen size and type',
    placeholder: 'e.g., 6.7-inch AMOLED, 120Hz'
  },
  processor: {
    label: 'Processor',
    help: 'CPU/Chipset details',
    placeholder: 'e.g., Snapdragon 8 Gen 3'
  },
  ram: {
    label: 'RAM',
    help: 'Memory capacity',
    placeholder: 'e.g., 12GB LPDDR5'
  },
  storage: {
    label: 'Storage',
    help: 'Internal storage capacity',
    placeholder: 'e.g., 256GB UFS 4.0'
  },
  camera: {
    label: 'Camera',
    help: 'Camera specifications',
    placeholder: 'e.g., 200MP + 12MP + 10MP + 10MP'
  },
  battery: {
    label: 'Battery',
    help: 'Battery capacity and charging',
    placeholder: 'e.g., 5000mAh with 45W fast charging'
  },
  os: {
    label: 'Operating System',
    help: 'OS version',
    placeholder: 'e.g., Android 14'
  },
  network: {
    label: 'Network',
    help: 'Connectivity options',
    placeholder: 'e.g., 5G, 4G LTE, WiFi 6E'
  },
  material: {
    label: 'Material',
    help: 'Fabric or material type',
    placeholder: 'e.g., 100% Cotton'
  },
  fit: {
    label: 'Fit',
    help: 'Fit type',
    placeholder: 'e.g., Regular Fit, Slim Fit'
  },
  author: {
    label: 'Author',
    help: 'Book author name',
    placeholder: 'e.g., J.K. Rowling'
  },
  isbn: {
    label: 'ISBN',
    help: 'International Standard Book Number',
    placeholder: 'e.g., 978-3-16-148410-0'
  },
  fssaiNumber: {
    label: 'FSSAI License Number',
    help: 'Food Safety and Standards Authority of India license',
    placeholder: 'e.g., 12345678901234'
  },
  expiryDate: {
    label: 'Expiry Date',
    help: 'Best before date',
    placeholder: 'e.g., 2025-12-31'
  },
}
