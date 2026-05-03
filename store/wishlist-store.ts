import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/observability/logger';

interface WishlistItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  priceDropAlert: boolean;
  addedAt: string;
}

interface Wishlist {
  id: number;
  name: string;
  items: WishlistItem[];
  isPublic: boolean;
  createdAt: string;
}

interface WishlistState {
  wishlists: Wishlist[];
  isLoading: boolean;
  
  // Actions
  createWishlist: (name: string) => void;
  deleteWishlist: (id: number) => void;
  addItemToWishlist: (wishlistId: number, item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItemFromWishlist: (wishlistId: number, itemId: number) => void;
  moveItemToCart: (wishlistId: number, itemId: number) => void;
  toggleWishlistVisibility: (id: number) => void;
  
  // Computed
  getTotalItems: () => number;
  getPriceDropItems: () => WishlistItem[];
  getWishlistById: (id: number) => Wishlist | undefined;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlists: [
        {
          id: 1,
          name: 'My Wishlist',
          items: [],
          isPublic: false,
          createdAt: new Date().toISOString()
        }
      ],
      isLoading: false,

      createWishlist: (name: string) => {
        const newWishlist: Wishlist = {
          id: Date.now(),
          name,
          items: [],
          isPublic: false,
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          wishlists: [...state.wishlists, newWishlist]
        }));
      },

      deleteWishlist: (id: number) => {
        set(state => ({
          wishlists: state.wishlists.filter(w => w.id !== id)
        }));
      },

      addItemToWishlist: (wishlistId: number, item) => {
        const newItem: WishlistItem = {
          ...item,
          id: Date.now(),
          addedAt: new Date().toISOString()
        };

        set(state => ({
          wishlists: state.wishlists.map(wishlist =>
            wishlist.id === wishlistId
              ? { ...wishlist, items: [...wishlist.items, newItem] }
              : wishlist
          )
        }));
      },

      removeItemFromWishlist: (wishlistId: number, itemId: number) => {
        set(state => ({
          wishlists: state.wishlists.map(wishlist =>
            wishlist.id === wishlistId
              ? { ...wishlist, items: wishlist.items.filter(item => item.id !== itemId) }
              : wishlist
          )
        }));
      },

      moveItemToCart: (wishlistId: number, itemId: number) => {
        // This would integrate with the cart store
        const { wishlists } = get();
        const wishlist = wishlists.find(w => w.id === wishlistId);
        const item = wishlist?.items.find(i => i.id === itemId);
        
        if (item) {
          // Add to cart logic here
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Moving to cart:', { item });
          }
          
          // Remove from wishlist
          get().removeItemFromWishlist(wishlistId, itemId);
        }
      },

      toggleWishlistVisibility: (id: number) => {
        set(state => ({
          wishlists: state.wishlists.map(wishlist =>
            wishlist.id === id
              ? { ...wishlist, isPublic: !wishlist.isPublic }
              : wishlist
          )
        }));
      },

      getTotalItems: () => {
        const { wishlists } = get();
        return wishlists.reduce((total, wishlist) => total + wishlist.items.length, 0);
      },

      getPriceDropItems: () => {
        const { wishlists } = get();
        return wishlists.flatMap(w => w.items).filter(item => item.priceDropAlert);
      },

      getWishlistById: (id: number) => {
        const { wishlists } = get();
        return wishlists.find(w => w.id === id);
      }
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ wishlists: state.wishlists })
    }
  )
);