import { Dictionary } from './en';

export const hi: Dictionary = {
  common: {
    loading: 'लोड हो रहा है...',
    error: 'एक त्रुटि हुई',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    search: 'खोजें...',
    welcome: 'आपका स्वागत है, {name}!',
    signOut: 'साइन आउट',
    signIn: 'साइन इन',
    register: 'रजिस्टर करें',
  },
  navigation: {
    home: 'होम',
    products: 'उत्पाद',
    orders: 'ऑर्डर',
    cart: 'कार्ट',
    settings: 'सेटिंग्स',
    sellerDashboard: 'विक्रेता डैशबोर्ड',
  },
  products: {
    price: 'कीमत',
    addToCart: 'कार्ट में जोड़ें',
    addedToCart: 'कार्ट में जोड़ा गया',
    outOfStock: 'स्टॉक में नहीं है',
    reviews: 'समीक्षाएं ({count})',
    noProducts: 'कोई उत्पाद नहीं मिला',
  },
  cart: {
    title: 'शॉपिंग कार्ट',
    empty: 'आपकी कार्ट खाली है',
    checkout: 'चेकआउट के लिए आगे बढ़ें',
    total: 'कुल',
    subtotal: 'उप-योग',
    items: '{count} उत्पाद',
  },
  seller: {
    dashboardTitle: 'वाणिज्यिक केंद्र',
    totalSales: 'कुल बिक्री',
    activeProducts: 'सक्रिय उत्पाद',
    storeSetup: 'उत्पत्ति: स्टोर सेटअप',
    initializeStore: 'स्टोर प्रारंभ करें',
  },
};
