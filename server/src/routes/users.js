import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repositories/userRepository.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const newUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['admin', 'member']),
});

router.get('/', requireAuth, requireAdmin, (req, res) => {
  res.json(userRepository.listAll());
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const parsed = newUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (userRepository.findByUsername(parsed.data.username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
  const user = userRepository.create({ ...parsed.data, passwordHash });
  res.status(201).json(user);
});

export default router;
