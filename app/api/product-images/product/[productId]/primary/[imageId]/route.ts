import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';

type ProductImage = {
  id: string;
  productId: string;
  isPrimary?: boolean;
  [key: string]: unknown;
};

let productImages: ProductImage[] = (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ as ProductImage[] || [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, context: any) {
  const paramsObj = await Promise.resolve(context?.params);
  const { productId, imageId } = paramsObj || {};
  const prisma = await import('@/lib/db/prismaClient').then(m => m.getPrisma()).catch(() => undefined);
  if (prisma) {
    await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    await prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    return NextResponse.json({ success: true });
  }

  // fallback in-memory store for environments without Prisma
  logger.info('Prisma unavailable; updating in-memory product images', { productId, imageId });
  productImages = productImages.map(img =>
    img.productId === productId ? { ...img, isPrimary: img.id === imageId } : img
  );
  (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ = productImages;
  return NextResponse.json({ success: true });
}
