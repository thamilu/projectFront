export { flashDeals, featuredProducts, testimonials } from './demoData';
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
] as const;

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

export const accentColors = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'pink', class: 'bg-pink-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'teal', class: 'bg-teal-500' },
  { name: 'cyan', class: 'bg-cyan-500' },
] as const;

export const categories = [
  { name: 'Electronics', icon: '💻', color: 'from-blue-500 to-cyan-500', count: '5.2K' },
  { name: 'Fashion', icon: '👗', color: 'from-pink-500 to-rose-500', count: '8.1K' },
  { name: 'Home & Living', icon: '🏠', color: 'from-green-500 to-emerald-500', count: '3.5K' },
  { name: 'Sports', icon: '⚽', color: 'from-orange-500 to-yellow-500', count: '2.3K' },
  { name: 'Beauty', icon: '💄', color: 'from-purple-500 to-pink-500', count: '4.7K' },
  { name: 'Books', icon: '📚', color: 'from-indigo-500 to-blue-500', count: '1.9K' },
] as const;

export const products = [
  { emoji: '📱', name: 'iPhone 15 Pro Max', price: 899, oldPrice: 1199, discount: 25, rating: 4.8, reviews: 2341 },
  { emoji: '👟', name: 'Nike Air Max 2024', price: 139, oldPrice: 200, discount: 31, rating: 4.7, reviews: 892 },
  { emoji: '⌚', name: 'Apple Watch Series 9', price: 349, oldPrice: 449, discount: 22, rating: 4.9, reviews: 1567 },
  { emoji: '🎧', name: 'Sony WH-1000XM5', price: 299, oldPrice: 399, discount: 25, rating: 4.9, reviews: 3421 },
  { emoji: '💻', name: 'MacBook Air M3', price: 1099, oldPrice: 1299, discount: 15, rating: 4.8, reviews: 1234 },
  { emoji: '👕', name: 'Premium Cotton Tee', price: 29, oldPrice: 49, discount: 41, rating: 4.6, reviews: 567 },
  { emoji: '📷', name: 'Canon EOS R50', price: 699, oldPrice: 899, discount: 22, rating: 4.7, reviews: 432 },
  { emoji: '🎮', name: 'PS5 Console', price: 449, oldPrice: 499, discount: 10, rating: 4.9, reviews: 5678 },
  { emoji: '🏀', name: 'Spalding Basketball', price: 39, oldPrice: 59, discount: 34, rating: 4.5, reviews: 234 },
  { emoji: '🎒', name: 'Travel Backpack Pro', price: 79, oldPrice: 129, discount: 39, rating: 4.6, reviews: 891 },
] as const;

export const gridColsMap: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

export const settingsTabs = [
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { id: 'language', label: 'Language & Region', icon: 'Globe' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell' },
  { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility' },
  { id: 'display', label: 'Display', icon: 'Layout' },
  { id: 'privacy', label: 'Privacy', icon: 'Lock' },
  { id: 'help', label: 'Help & Support', icon: 'HelpCircle' },
] as const;

// Export business constants
export * from './api/endpoints';
export * from './business';
export * from './routes/app-routes';
