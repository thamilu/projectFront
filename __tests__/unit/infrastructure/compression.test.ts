/**
 * @jest-environment jsdom
 *
 * jsdom doesn't implement canvas rendering or real image decoding, so
 * FileReader/Image/HTMLCanvasElement are faked here with just enough
 * behavior (synchronous callbacks, controllable width/height, a captured
 * toBlob mimeType/dimensions) to exercise compressImage's actual logic —
 * not to simulate real image decoding.
 */
import { compressImage } from '@/infrastructure/image/compression';

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

let nextImageDims = { width: 0, height: 0 };
let capturedToBlob: { type?: string; canvasWidth?: number; canvasHeight?: number } = {};
let toBlobShouldYieldNull = false;
let getContextReturnsNull = false;

class FakeImage {
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  width = nextImageDims.width;
  height = nextImageDims.height;
  private _src = '';
  set src(v: string) {
    this._src = v;
    this.width = nextImageDims.width;
    this.height = nextImageDims.height;
    // Deferred to a microtask: compression.ts assigns img.src BEFORE
    // img.onload — firing synchronously here would call a still-null
    // onload and the real handler assigned right after would never run.
    queueMicrotask(() => this.onload?.());
  }
  get src() {
    return this._src;
  }
}

class FakeFileReader {
  onload: ((ev: { target: { result: string } }) => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | null = null;
  readAsDataURL(_file: File) {
    this.result = 'data:fake;base64,AAAA';
    // Same ordering hazard as FakeImage — compression.ts assigns
    // reader.onload only after calling readAsDataURL().
    queueMicrotask(() => this.onload?.({ target: { result: this.result as string } }));
  }
}

describe('compressImage', () => {
  const originalImage = global.Image;
  const originalFileReader = global.FileReader;

  beforeEach(() => {
    capturedToBlob = {};
    toBlobShouldYieldNull = false;
    getContextReturnsNull = false;

    (global as unknown as { Image: typeof Image }).Image = FakeImage as unknown as typeof Image;
    (global as unknown as { FileReader: typeof FileReader }).FileReader =
      FakeFileReader as unknown as typeof FileReader;

    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement
    ) {
      if (getContextReturnsNull) return null;
      return { drawImage: jest.fn() } as unknown as CanvasRenderingContext2D;
    } as typeof HTMLCanvasElement.prototype.getContext);

    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (this: HTMLCanvasElement, callback: BlobCallback, type?: string) {
        capturedToBlob = { type, canvasWidth: this.width, canvasHeight: this.height };
        callback(toBlobShouldYieldNull ? null : new Blob(['fake'], { type }));
      });
  });

  afterEach(() => {
    global.Image = originalImage;
    global.FileReader = originalFileReader;
    jest.restoreAllMocks();
  });

  it('returns the original file unchanged when already under 500KB', async () => {
    const file = makeFile('small.jpg', 'image/jpeg', 100 * 1024);
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it('scales both dimensions to fit within the bounding box, not just the dominant axis', async () => {
    // Regression: the previous implementation only checked the dominant
    // axis's own threshold (width>maxWidth when width>height), so a
    // 2000x1500 image against {maxWidth:1920, maxHeight:1080} resized to
    // 1920x1440 — still 360px over maxHeight. A single min() scale factor
    // must bound both axes at once: scale = min(1, 1920/2000, 1080/1500) = 0.72.
    nextImageDims = { width: 2000, height: 1500 };
    const file = makeFile('landscape.jpg', 'image/jpeg', 600 * 1024);

    await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });

    expect(capturedToBlob.canvasWidth).toBe(1440);
    expect(capturedToBlob.canvasHeight).toBe(1080);
    expect(capturedToBlob.canvasWidth).toBeLessThanOrEqual(1920);
    expect(capturedToBlob.canvasHeight).toBeLessThanOrEqual(1080);
  });

  it('leaves dimensions unchanged when the image already fits within the bounding box', async () => {
    nextImageDims = { width: 800, height: 600 };
    const file = makeFile('small-dims.jpg', 'image/jpeg', 600 * 1024);

    await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });

    expect(capturedToBlob.canvasWidth).toBe(800);
    expect(capturedToBlob.canvasHeight).toBe(600);
  });

  it('preserves the input mimeType by default instead of forcing JPEG (PNG transparency)', async () => {
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('logo.png', 'image/png', 600 * 1024);

    const result = await compressImage(file);

    expect(capturedToBlob.type).toBe('image/png');
    expect(result.type).toBe('image/png');
  });

  it('preserves WebP input as WebP', async () => {
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('photo.webp', 'image/webp', 600 * 1024);

    await compressImage(file);

    expect(capturedToBlob.type).toBe('image/webp');
  });

  it('falls back to JPEG for a type the canvas cannot re-encode', async () => {
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('photo.heic', 'image/heic', 600 * 1024);

    await compressImage(file);

    expect(capturedToBlob.type).toBe('image/jpeg');
  });

  it('respects an explicit mimeType override even when it differs from the input type', async () => {
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('photo.png', 'image/png', 600 * 1024);

    await compressImage(file, { mimeType: 'image/webp' });

    expect(capturedToBlob.type).toBe('image/webp');
  });

  it('rejects when the canvas 2D context is unavailable', async () => {
    getContextReturnsNull = true;
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('photo.jpg', 'image/jpeg', 600 * 1024);

    await expect(compressImage(file)).rejects.toThrow('Canvas context failed');
  });

  it('rejects when toBlob yields no blob', async () => {
    toBlobShouldYieldNull = true;
    nextImageDims = { width: 1000, height: 800 };
    const file = makeFile('photo.jpg', 'image/jpeg', 600 * 1024);

    await expect(compressImage(file)).rejects.toThrow('Compression failed');
  });
});
