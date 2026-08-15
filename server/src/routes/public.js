// Public, unauthenticated endpoints for the marketing website:
//   • a lightweight school contact card for the header/footer, and
//   • the admissions enquiry form handler.
// Mounted UNAUTHENTICATED at /api/public by the app — no auth is applied here.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { createEnquiry } from '../services/leadIntake.js';

const router = Router();

const FALLBACK_SCHOOL = {
  name: 'Wellspire International School',
  phone: '+91 99883 34844',
  email: 'info@wellspireinternational.com',
  address: 'Hyderabad',
};

// Public school contact card — safe subset of the school record.
router.get('/public/school', asyncHandler(async (_req, res) => {
  const schools = await db.list('schools');
  const school = schools[0];
  if (!school) return res.json(FALLBACK_SCHOOL);
  res.json({
    name: school.name || FALLBACK_SCHOOL.name,
    phone: school.phone || FALLBACK_SCHOOL.phone,
    email: school.email || FALLBACK_SCHOOL.email,
    address: school.address || FALLBACK_SCHOOL.address,
  });
}));

const enquirySchema = z.object({
  parent_name: z.string().min(1, 'Your name is required'),
  child_name: z.string().optional(),
  grade: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: z.string().optional(),
  message: z.string().optional(),
});

// Admissions enquiry submission — creates a lead and fans out notifications.
router.post('/public/enquiry', asyncHandler(async (req, res) => {
  const result = enquirySchema.safeParse(req.body);
  if (!result.success) throw new HttpError(422, 'Validation failed', result.error.flatten());
  const lead = await createEnquiry(result.data);
  res.status(201).json({
    ok: true,
    id: lead.id,
    message: 'Thanks — our admissions team will be in touch.',
  });
}));

export default router;
