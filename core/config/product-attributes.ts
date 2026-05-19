export type AttributeType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox';

export interface AttributeOption {
  label: string;
  value: string;
}

export interface ProductAttributeConstant {
  name: string; // Key in the attributes object
  label: string;
  type: AttributeType;
  placeholder?: string;
  options?: AttributeOption[]; // For select/multiselect
  required?: boolean;
  unit?: string;
  helperText?: string;
}

// Map of Category Name (or substring) to Attributes
export const CATEGORY_ATTRIBUTES: Record<string, ProductAttributeConstant[]> = {
  // 1. Fashion & Apparel
  'FASHION': [
    {
      name: 'material',
      label: 'Material',
      type: 'select',
      options: [
        { label: 'Cotton', value: 'Cotton' },
        { label: 'Polyester', value: 'Polyester' },
        { label: 'Silk', value: 'Silk' },
        { label: 'Denim', value: 'Denim' },
        { label: 'Wool', value: 'Wool' },
        { label: 'Linen', value: 'Linen' },
        { label: 'Leather', value: 'Leather' },
        { label: 'Blends', value: 'Blends' },
      ],
      required: true,
    },
    {
      name: 'fit',
      label: 'Fit Type',
      type: 'select',
      options: [
        { label: 'Slim Fit', value: 'Slim' },
        { label: 'Regular Fit', value: 'Regular' },
        { label: 'Relaxed / Loose', value: 'Relaxed' },
        { label: 'Oversized', value: 'Oversized' },
        { label: 'Skinny', value: 'Skinny' },
      ],
    },
    {
      name: 'gender',
      label: 'Gender / Department',
      type: 'select',
      options: [
        { label: 'Men', value: 'Men' },
        { label: 'Women', value: 'Women' },
        { label: 'Kids (Boys)', value: 'Boys' },
        { label: 'Kids (Girls)', value: 'Girls' },
        { label: 'Unisex', value: 'Unisex' },
      ],
      required: true,
    },
    {
      name: 'pattern',
      label: 'Pattern',
      type: 'select',
      options: [
        { label: 'Solid / Plain', value: 'Solid' },
        { label: 'Printed', value: 'Printed' },
        { label: 'Striped', value: 'Striped' },
        { label: 'Checked', value: 'Checked' },
        { label: 'Textured', value: 'Textured' },
      ],
    },
    {
      name: 'careInstructions',
      label: 'Care Instructions',
      type: 'text',
      placeholder: 'e.g., Machine wash cold, Do not bleach',
    },
  ],

  // 2. Electronics
  'ELECTRONICS': [
    {
      name: 'warrantyPeriod',
      label: 'Warranty Period',
      type: 'select',
      options: [
        { label: 'No Warranty', value: 'None' },
        { label: '6 Months', value: '6 Months' },
        { label: '1 Year', value: '1 Year' },
        { label: '2 Years', value: '2 Years' },
        { label: '3 Years', value: '3 Years' },
      ],
      required: true,
    },
    {
      name: 'modelNumber',
      label: 'Model Number',
      type: 'text',
      placeholder: 'e.g., SM-G990B',
    },
    {
      name: 'voltage',
      label: 'Voltage / Power',
      type: 'text',
      placeholder: 'e.g., 220V, 500W',
    },
    {
      name: 'features',
      label: 'Key Features',
      type: 'text',
      placeholder: 'Comma separated features',
      helperText: 'e.g., Bluetooth 5.0, Noise Cancellation, Waterproof',
    },
  ],

  // 3. Grocery & Essentials
  'GROCERY': [
    {
      name: 'freshnessType',
      label: 'Freshness Type',
      type: 'select',
      options: [
        { label: 'Fresh', value: 'Fresh' },
        { label: 'Organic', value: 'Organic' },
        { label: 'Frozen', value: 'Frozen' },
        { label: 'Dried', value: 'Dried' },
      ],
    },
    {
      name: 'shelfLife',
      label: 'Shelf Life',
      type: 'text',
      placeholder: 'e.g., 5 Days, 12 Months',
      required: true,
    },
    {
      name: 'fssaiLicense',
      label: 'FSSAI License No.',
      type: 'text',
      placeholder: '14-digit license number',
    },
    {
      name: 'isVegetarian',
      label: 'Vegetarian Product',
      type: 'checkbox',
    },
    {
      name: 'expiryDate',
      label: 'Expiry Date',
      type: 'date',
    },
  ],

    // 4. Beauty and personal care
    'BEAUTY': [
        {
        name: 'skinType',
        label: 'Skin Type',
        type: 'select',
        options: [
            { label: 'All Skin Types', value: 'All' },
            { label: 'Oily', value: 'Oily' },
            { label: 'Dry', value: 'Dry' },
            { label: 'Combination', value: 'Combination' },
            { label: 'Sensitive', value: 'Sensitive' },
        ],
        },
        {
        name: 'applicationArea',
        label: 'Application Area',
        type: 'select',
        options: [
            { label: 'Face', value: 'Face' },
            { label: 'Body', value: 'Body' },
            { label: 'Hair', value: 'Hair' },
        ],
        },
        {
        name: 'ingredients',
        label: 'Key Ingredients',
        type: 'text',
        placeholder: 'e.g., Vitamin C, Hyaluronic Acid',
        },
    ],
};

// Helper to determine category key from full category name
export function getCategoryKey(categoryName: string): string {
  const lowername = categoryName.toLowerCase();
  
  if (lowername.includes('fashion') || lowername.includes('clothing') || lowername.includes('apparel')) return 'FASHION';
  if (lowername.includes('electronic') || lowername.includes('mobile') || lowername.includes('laptop')) return 'ELECTRONICS';
  if (lowername.includes('grocery') || lowername.includes('food')) return 'GROCERY';
  if (lowername.includes('beauty') || lowername.includes('health')) return 'BEAUTY';
  
  return 'OTHER'; // Default or generic
}
