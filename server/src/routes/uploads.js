// File uploads backed by Supabase Storage.
//
// Kept dependency-free: instead of multipart/multer, the client sends the file
// as base64 JSON (fits comfortably in the app's 2mb body limit). When Supabase
// isn't configured the endpoint reports it honestly (501) rather than pretending
// to store anything, so demo mode stays predictable.
import { Router } from 'express';
import { z } from 'zod';
import storage from '../lib/storage.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

// Where an upload lands. Buckets are created on demand (public) by storage.js.
const DEFAULT_BUCKET = 'uploads';
// Keep folder names to a safe, predictable set to avoid path surprises.
const SAFE_FOLDER = /^[a-z0-9][a-z0-9/_-]*$/i;

const uploadSchema = z.object({
  filename: z.string().min(1, 'filename is required'),
  contentBase64: z.string().min(1, 'contentBase64 is required'),
  contentType: z.string().optional(),
  bucket: z.string().optional(),
  folder: z.string().optional(),
});

// Report whether persistent storage is available (Supabase configured).
router.get('/uploads/status', (_req, res) => {
  res.json({ configured: storage.configured });
});

// Upload a file and get back its public URL.
router.post('/uploads', asyncHandler(async (req, res) => {
  if (!storage.configured) {
    throw new HttpError(
      501,
      'File storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable uploads.',
    );
  }

  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(422, 'Validation failed', parsed.error.flatten());
  const { filename, contentBase64, contentType, bucket, folder } = parsed.data;

  if (folder && !SAFE_FOLDER.test(folder)) throw new HttpError(422, 'Invalid folder name');

  let buffer;
  try {
    // Accept either a raw base64 string or a full data: URL.
    const b64 = contentBase64.includes(',') ? contentBase64.split(',').pop() : contentBase64;
    buffer = Buffer.from(b64, 'base64');
  } catch {
    throw new HttpError(422, 'contentBase64 is not valid base64');
  }
  if (!buffer.length) throw new HttpError(422, 'Uploaded file is empty');

  // Namespace the object so concurrent uploads of the same filename don't clash,
  // using the request-scoped hrtime instead of Date.now (deterministic-friendly).
  const safeName = filename.replace(/[^a-z0-9._-]/gi, '_');
  const stamp = process.hrtime.bigint().toString(36);
  const objectPath = `${folder ? `${folder}/` : ''}${stamp}-${safeName}`;

  const result = await storage.uploadFile(
    bucket || DEFAULT_BUCKET,
    objectPath,
    buffer,
    contentType || 'application/octet-stream',
  );

  if (!result.publicUrl) {
    throw new HttpError(502, result.error || 'Upload failed');
  }
  res.status(201).json({ ok: true, ...result });
}));

export default router;
