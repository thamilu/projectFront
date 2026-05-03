import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';

// Simple in-memory store for demo purposes
type ImageRecord = {
  id: string;
  productId: string;
  cloudinaryUrl: string;
  thumbnailUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
  width: number;
  height: number;
};

let productImages: ImageRecord[] = [];

// expose in-memory store on global for other handlers/tests
(global as Record<string, unknown>).__PRODUCT_IMAGES_STORE__ = productImages;

type UploadResult = {
  url: string;
  width?: number;
  height?: number;
};

async function uploadToCloudinary(dataUri: string): Promise<UploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary not configured');
  }

  const mod = await import('cloudinary');
  const cloudinary = mod.v2 || mod;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const res = await cloudinary.uploader.upload(dataUri, {
    folder: 'product_images',
    resource_type: 'image',
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });

  return { url: res.secure_url as string, width: res.width, height: res.height };
}

async function uploadToBunny(fileBuffer: Buffer, filename: string): Promise<UploadResult> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_API_KEY;
  const cdnEndpoint = process.env.BUNNY_CDN_ENDPOINT; // optional: e.g. https://yourzone.b-cdn.net

  if (!storageZone || !apiKey) {
    throw new Error('Bunny.net storage not configured (BUNNY_STORAGE_ZONE, BUNNY_API_KEY)');
  }

  // Upload to Bunny Storage: PUT https://storage.bunnycdn.com/{storageZone}/{path}
  const path = `product_images/${Date.now()}_${Math.floor(Math.random() * 10000)}_${filename}`;
  const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${path}`;

  // Convert Buffer to ArrayBuffer slice to satisfy fetch typings
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: (new Uint8Array(arrayBuffer) as unknown) as BodyInit,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Bunny.net upload failed: ${res.status} ${txt}`);
  }

  // Build a publicly-accessible URL. Prefer provided CDN endpoint if available.
  const publicUrl = cdnEndpoint ? `${cdnEndpoint.replace(/\/$/, '')}/${path}` : `https://storage.bunnycdn.com/${storageZone}/${path}`;
  return { url: publicUrl };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productId = String(formData.get('productId') || '');
    const altText = String(formData.get('altText') || '');
    const isPrimary = String(formData.get('isPrimary') || 'false') === 'true';
    const file = formData.get('file') as unknown as File | null;

    if (!productId || !file) {
      return NextResponse.json({ error: 'productId and file are required' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Choose provider: CLOUDINARY or BUNNY (default CLOUDINARY)
    const provider = (process.env.IMAGE_PROVIDER || 'CLOUDINARY').toUpperCase();

    let uploadRes: UploadResult;
    if (provider === 'BUNNY') {
      // Use original filename if available
      const filename = (file as File).name || 'upload.jpg';
      uploadRes = await uploadToBunny(buffer, filename);
    } else {
      const dataUri = `data:${(file as File).type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      uploadRes = await uploadToCloudinary(dataUri);
    }

    // Persist using Prisma if available
    const prisma = await (await import('@/lib/db/prismaClient')).getPrisma().catch(() => undefined);
    if (prisma) {
      // unset existing primary if needed
      if (isPrimary) {
        await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
      }

      const created = await prisma.productImage.create({
        data: {
          productId,
          url: uploadRes.url,
          thumbnail: uploadRes.url,
          altText: altText || null,
          displayOrder: (await prisma.productImage.count({ where: { productId } })),
          isPrimary,
          width: uploadRes.width ?? 0,
          height: uploadRes.height ?? 0,
        },
      });

      return NextResponse.json(created, { status: 201 });
    }

    const newImage: ImageRecord = {
      id: `img_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      productId,
      cloudinaryUrl: uploadRes.url,
      thumbnailUrl: uploadRes.url,
      altText: altText || '',
      displayOrder: productImages.filter(p => p.productId === productId).length,
      isPrimary,
      width: uploadRes.width || 0,
      height: uploadRes.height || 0,
    };

    // If set primary, unset others for same product
    if (isPrimary) {
      productImages = productImages.map(img => img.productId === productId ? { ...img, isPrimary: false } : img);
    }

    productImages.push(newImage);

    return NextResponse.json(newImage, { status: 201 });
  } catch (err: unknown) {
    logger.error('product-images POST error', { error: err });
    return NextResponse.json({ error: (err as Error)?.message || 'Upload failed' }, { status: 500 });
  }
}
