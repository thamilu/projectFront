import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/http/services';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const productImages: any[] = (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ as any[] || [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const paramsObj = await Promise.resolve(context?.params);
  const imageId = String(paramsObj?.imageId || '');
  try {
    const { data: image } = await apiClient.get(`/api/v1/product-images/${imageId}`);
    return NextResponse.json(image);
  } catch (err) {
    // Fallback to memory or 404
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const image = productImages.find((img: any) => img.id === imageId);
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(image);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: any) {
  const paramsObj = await Promise.resolve(context?.params);
  const imageId = String(paramsObj?.imageId || '');
  try {
    await apiClient.delete(`/api/v1/product-images/${imageId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    // Fallback to memory
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx = productImages.findIndex((img: any) => img.id === imageId);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  productImages.splice(idx, 1);
  (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ = productImages;
  return NextResponse.json({ success: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, context: any) {
  const paramsObj = await Promise.resolve(context?.params);
  const imageId = String(paramsObj?.imageId || '');
  const body = await request.json().catch(() => ({}));
  try {
    const { data: updated } = await apiClient.put(`/api/v1/product-images/${imageId}`, body);
    return NextResponse.json(updated);
  } catch (err) {
    // Fallback to memory
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx = productImages.findIndex((img: any) => img.id === imageId);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = { ...(productImages[idx] as object), ...body };
  productImages[idx] = updated;
  (global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ = productImages;
  return NextResponse.json(updated);
}
