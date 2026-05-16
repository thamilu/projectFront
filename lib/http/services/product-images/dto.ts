/**
 * [HARDEN] Product Image Entity
 */
export interface ProductImage {
  id: string;
  productId: string;
  url?: string;
  thumbnailUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
  createdAt?: string;
}
