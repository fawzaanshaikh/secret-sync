import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repositories/userRepository.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

const credentialsSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

// First-run setup: only works while there are zero users. Creates the initial Admin.
router.post('/setup', (req, res) => {
  if (userRepository.countAll() > 0) {
    return res.status(409).json({ error: 'Setup already completed' });
  }
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
  const user = userRepository.create({ username: parsed.data.username, passwordHash, role: 'admin' });
  return res.status(201).json({ token: signToken(user), user });
});

router.get('/setup', (req, res) => {
  res.json({ needsSetup: userRepository.countAll() === 0 });
});

router.post('/login', (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const row = userRepository.findByUsername(parsed.data.username);
  if (!row || !bcrypt.compareSync(parsed.data.password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = { id: row.id, username: row.username, role: row.role };
  return res.json({ token: signToken(user), user });
});

export default router;
