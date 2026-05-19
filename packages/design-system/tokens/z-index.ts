/**
 * Enterprise Design Tokens: Z-Index Layers
 */
export const zIndex = {
  deep: -1,
  default: 0,
  active: 1,
  
  // Layout components
  sticky: 100,
  fixed: 200,
  
  // Floating components
  dropdown: 1000,
  popover: 1500,
  tooltip: 2000,
  
  // Overlays & blocking elements
  modalBackdrop: 3000,
  modal: 3100,
  drawer: 3200,
  
  // Top level indicators
  toast: 5000,
  loading: 6000,
  debug: 9999,
} as const;
