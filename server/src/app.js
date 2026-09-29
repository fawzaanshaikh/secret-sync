import express from 'express';
import cors from 'cors';
import { getDb } from './db/connection.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import branchRoutes from './routes/branches.js';
import envVarRoutes from './routes/envVars.js';
import proposalRoutes from './routes/proposals.js';

getDb(); // opens the connection and runs pending migrations on boot

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/branches', branchRoutes);
app.use('/api/projects/:projectId/env', envVarRoutes);
app.use('/api/proposals', proposalRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
