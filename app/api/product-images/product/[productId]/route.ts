import { NextRequest, NextResponse } from 'next/server';

// Import the in-memory store from sibling file by duplicating store here for simplicity
// In a production app, share a DB or module-scoped store.
const productImages: unknown[] = (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ as unknown[] || [];

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const images = productImages.filter(img => (img as Record<string, unknown>).productId === productId);
  return NextResponse.json(images);
}

// Expose store for other modules in dev (not persisted)
(global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ = productImages;
