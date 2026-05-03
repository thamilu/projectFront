import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProductApiSchema } from "@/lib/validations/product";

// Mock database - Replace with your actual database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const products: any[] = [];

// Helper to simulate authentication - Replace with your auth logic
async function getCurrentSeller(request: NextRequest) {
  // Example: Get from session, JWT, etc.
  const sellerId = request.headers.get("x-seller-id") || "seller-123";
  
  if (!sellerId) {
    return null;
  }

  return {
    id: sellerId,
    email: "seller@example.com",
    name: "John Seller",
  };
}

// Upload images to Cloudinary. Accepts base64 data URLs or already-hosted URLs.
async function uploadImagesToCloudinary(images: string[]): Promise<string[]> {
  // If no cloudinary config provided, surface a clear error
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }

  // Dynamically import cloudinary to avoid build-time hard dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cloudinary: any;
  try {
    const mod = await import("cloudinary");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloudinary = (mod as any).v2 || mod;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  } catch (err) {
    console.error("Failed to load cloudinary package:", err);
    throw new Error("Cloudinary package is not installed. Run `npm install cloudinary`.");
  }

  const uploadPromises = images.map(async (img, idx) => {
    // If the image already looks like a URL, return it as-is (assume hosted)
    if (typeof img === "string" && /^https?:\/\//i.test(img)) {
      return img;
    }

    // Otherwise assume base64 data URL and upload
    try {
      const res = await cloudinary.uploader.upload(img, {
        folder: "products",
        public_id: `product-${Date.now()}-${idx}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      });

      return res.secure_url as string;
    } catch (error) {
      console.error("Cloudinary upload failed for image", idx, error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  });

  return Promise.all(uploadPromises);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate seller
    const seller = await getCurrentSeller(request);

    if (!seller) {
      return NextResponse.json(
        { error: "Unauthorized. Please login as a seller." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = createProductApiSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 3. Upload images (base64) to Cloudinary (or pass through URLs)
    let uploadedImageUrls: string[];
    try {
      uploadedImageUrls = await uploadImagesToCloudinary(validatedData.images);
    } catch (err) {
      console.error("Image upload error:", err);
      return NextResponse.json({ error: "Image upload failed", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }

    // 4. Create product in database
    const newProduct = {
      id: `product-${Date.now()}`,
      ...validatedData,
      images: uploadedImageUrls,
      sellerId: seller.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database (mock)
    products.push(newProduct);

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const seller = await getCurrentSeller(request);

    if (!seller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Filter products by seller
    const sellerProducts = products.filter(
      (product) => product.sellerId === seller.id
    );

    return NextResponse.json({
      success: true,
      products: sellerProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
