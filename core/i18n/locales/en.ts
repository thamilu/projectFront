export const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    search: 'Search...',
    welcome: 'Welcome, {name}!',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    register: 'Register',
  },
  navigation: {
    home: 'Home',
    products: 'Products',
    orders: 'Orders',
    cart: 'Cart',
    settings: 'Settings',
    sellerDashboard: 'Seller Dashboard',
  },
  products: {
    price: 'Price',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    outOfStock: 'Out of Stock',
    reviews: 'Reviews ({count})',
    noProducts: 'No products found',
  },
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    checkout: 'Proceed to Checkout',
    total: 'Total',
    subtotal: 'Subtotal',
    items: '{count} items',
  },
  seller: {
    dashboardTitle: 'Commercial Center',
    totalSales: 'Total Sales',
    activeProducts: 'Active Products',
    storeSetup: 'Genesis: Store Setup',
    initializeStore: 'Initialize Store',
  },
};

export type Dictionary = typeof en;
