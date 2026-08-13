import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// In-memory subscription store per user session (fallback to request header)
let mockUserSubscription = {
  email: 'dj@afrosenses.com',
  tier: 'FREE' as 'FREE' | 'PRO' | 'EXECUTIVE',
  updatedAt: new Date().toISOString(),
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // RBAC Express Middleware
  const requireTier = (minTier: 'PRO' | 'EXECUTIVE', featureName: string) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const userTier = (req.headers['x-user-tier'] as string) || mockUserSubscription.tier;
      
      const tierLevel = {
        FREE: 1,
        PRO: 2,
        EXECUTIVE: 3,
      };

      const currentLevel = tierLevel[userTier as keyof typeof tierLevel] || 1;
      const requiredLevel = tierLevel[minTier];

      if (currentLevel < requiredLevel) {
        return res.status(403).json({
          error: 'UPGRADE_REQUIRED',
          requiredTier: minTier,
          feature: featureName,
          message: `Action requires ${minTier} subscription tier. Current tier: ${userTier}.`,
        });
      }
      next();
    };
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Subscription management API
  app.get('/api/subscription', (req, res) => {
    const userTier = (req.headers['x-user-tier'] as string) || mockUserSubscription.tier;
    res.json({
      ...mockUserSubscription,
      tier: userTier,
    });
  });

  app.post('/api/subscription', (req, res) => {
    const { tier } = req.body;
    if (tier === 'FREE' || tier === 'PRO' || tier === 'EXECUTIVE') {
      mockUserSubscription = {
        email: 'dj@afrosenses.com',
        tier,
        updatedAt: new Date().toISOString(),
      };
      return res.json({ success: true, subscription: mockUserSubscription });
    }
    res.status(400).json({ error: 'Invalid tier specified' });
  });

  // Protected API Endpoints
  app.post('/api/ai-mix', requireTier('EXECUTIVE', 'AI_MIXER'), (req, res) => {
    res.json({
      success: true,
      message: 'AI Music Mixer execution authorized under Executive tier',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/crate-import', requireTier('PRO', 'XML_CRATE_IMPORT'), (req, res) => {
    res.json({
      success: true,
      message: 'Rekordbox XML & Serato .crate import authorized under Pro/Executive tier',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/cloud-sync', requireTier('EXECUTIVE', 'CLOUD_SYNC_INTEGRATION'), (req, res) => {
    res.json({
      success: true,
      message: 'Google Drive & Dropbox cloud sync authorized under Executive tier',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/export', requireTier('PRO', 'PLAYLIST_EXPORTS'), (req, res) => {
    res.json({
      success: true,
      message: 'Playlist set export authorized under Pro/Executive tier',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RBAC Server] Set Architect backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
