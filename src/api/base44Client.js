import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { applyDemoMode } from '@/lib/demo-mode';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});

// In demo mode (?demo=1), all entity writes are intercepted and never persisted
applyDemoMode(base44);