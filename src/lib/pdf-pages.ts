/* Draws pages of an uploaded PDF (or a photo of a page) as images in the
   browser, so diagrams can be cut out of them (services/bulk.ts). pdf.js is
   loaded only when it's needed, so it never slows down the rest of the site. */

export interface PageSource {
  pages: number;
  /** Page n (1 = first) drawn on a canvas, its longest side at most `maxSide` pixels. */
  render: (n: number, maxSide?: number) => Promise<HTMLCanvasElement>;
}

const canvasOf = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

export async function openPages(file: File): Promise<PageSource> {
  if (file.type.startsWith('image/')) {
    // A photo is one page.
    const bitmap = await createImageBitmap(file);
    return {
      pages: 1,
      render: async (_n, maxSide = 1800) => {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const c = canvasOf(bitmap.width * scale, bitmap.height * scale);
        c.getContext('2d')!.drawImage(bitmap, 0, 0, c.width, c.height);
        return c;
      },
    };
  }
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  // isEvalSupported off: a PDF can never run code here.
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  return {
    pages: doc.numPages,
    render: async (n, maxSide = 1800) => {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(3, maxSide / Math.max(base.width, base.height)) });
      const c = canvasOf(viewport.width, viewport.height);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      return c;
    },
  };
}

/** Part of a canvas, from a box of [ymin, xmin, ymax, xmax] in thousandths, with a little margin. */
export function crop(page: HTMLCanvasElement, box: number[], margin = 12): HTMLCanvasElement {
  const [ymin, xmin, ymax, xmax] = box.map((v) => Math.max(0, Math.min(1000, v)));
  const m = margin;
  const x = Math.max(0, ((xmin ?? 0) / 1000) * page.width - m);
  const y = Math.max(0, ((ymin ?? 0) / 1000) * page.height - m);
  const w = Math.min(page.width - x, (((xmax ?? 1000) - (xmin ?? 0)) / 1000) * page.width + 2 * m);
  const h = Math.min(page.height - y, (((ymax ?? 1000) - (ymin ?? 0)) / 1000) * page.height + 2 * m);
  const c = canvasOf(w, h);
  c.getContext('2d')!.drawImage(page, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}

export const toBlob = (c: HTMLCanvasElement, type = 'image/jpeg', quality = 0.88) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the page.'))), type, quality));
