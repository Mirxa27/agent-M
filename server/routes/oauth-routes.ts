import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { beginOAuthFlow, completeOAuthFlow, isOAuthSupported } from '../services/credential-service';
import { storage } from '../storage';

const router = Router();

/**
 * Begin OAuth flow for a service
 * POST /api/oauth/begin
 */
router.post('/begin', requireAuth, async (req, res) => {
  try {
    const { service, scopes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!service) {
      return res.status(400).json({ error: 'Service is required' });
    }

    if (!isOAuthSupported(service)) {
      return res.status(400).json({ 
        error: `OAuth not supported for service: ${service}`,
        supportedServices: ['google', 'gmail', 'google_drive', 'google_calendar', 'microsoft', 'outlook', 'onedrive', 'dropbox']
      });
    }

    const { authUrl, state } = await beginOAuthFlow(userId, service, scopes);

    res.json({
      success: true,
      authUrl,
      state,
      message: `Redirect user to the authUrl to complete ${service} OAuth flow`
    });

  } catch (error: any) {
    console.error('OAuth begin error:', error);
    res.status(500).json({
      error: 'Failed to begin OAuth flow',
      details: error.message
    });
  }
});

/**
 * Handle OAuth callback
 * GET /api/oauth/callback/:service
 */
router.get('/callback/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({
        error: 'OAuth authorization denied',
        details: oauthError
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing required OAuth parameters (code and state)'
      });
    }

    const { userId, credential } = await completeOAuthFlow(code as string, state as string);

    // Redirect to success page with credential info
    const successUrl = `/dashboard?oauth=success&service=${service}&credentialId=${credential.id}`;
    res.redirect(successUrl);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    // Redirect to error page
    const errorUrl = `/dashboard?oauth=error&message=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
});

/**
 * Get OAuth status for a service
 * GET /api/oauth/status/:service
 */
router.get('/status/:service', requireAuth, async (req, res) => {
  try {
    const { service } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
      service,
      supported: isOAuthSupported(service),
      configured: true, // You might want to check if OAuth credentials are configured
      scopes: getDefaultScopes(service)
    });

  } catch (error: any) {
    console.error('OAuth status error:', error);
    res.status(500).json({
      error: 'Failed to get OAuth status',
      details: error.message
    });
  }
});

/**
 * List supported OAuth services
 * GET /api/oauth/services
 */
router.get('/services', requireAuth, async (req, res) => {
  try {
    const services = [
      {
        id: 'google',
        name: 'Google',
        description: 'Access Gmail, Google Drive, and Google Calendar',
        supported: isOAuthSupported('google'),
        scopes: ['gmail', 'drive', 'calendar']
      },
      {
        id: 'microsoft',
        name: 'Microsoft',
        description: 'Access Outlook, OneDrive, and Microsoft services',
        supported: isOAuthSupported('microsoft'),
        scopes: ['mail', 'files', 'calendar']
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Access Dropbox files and folders',
        supported: isOAuthSupported('dropbox'),
        scopes: ['files']
      }
    ];

    res.json({
      success: true,
      services: services.filter(s => s.supported)
    });

  } catch (error: any) {
    console.error('OAuth services error:', error);
    res.status(500).json({
      error: 'Failed to get OAuth services',
      details: error.message
    });
  }
});

/**
 * Refresh OAuth token for a credential
 * POST /api/oauth/refresh/:credentialId
 */
router.post('/refresh/:credentialId', requireAuth, async (req, res) => {
  try {
    const { credentialId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get credential from database
    const credential = await storage.getCredentialById(parseInt(credentialId));
    
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (credential.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this credential' });
    }

    if (credential.authMethod !== 'oauth') {
      return res.status(400).json({ error: 'Credential is not OAuth-based' });
    }

    const { refreshOAuthTokens } = await import('../services/credential-service');
    const newTokens = await refreshOAuthTokens(credential);

    res.json({
      success: true,
      message: 'OAuth tokens refreshed successfully',
      expiresAt: newTokens.expiresAt
    });

  } catch (error: any) {
    console.error('OAuth refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh OAuth tokens',
      details: error.message
    });
  }
});

/**
 * Helper function to get default scopes for a service
 */
function getDefaultScopes(service: string): string[] {
  switch (service.toLowerCase()) {
    case 'google':
    case 'gmail':
      return ['gmail.readonly', 'gmail.send', 'userinfo.profile', 'userinfo.email'];
    case 'google_drive':
      return ['drive.readonly', 'drive.file', 'userinfo.profile', 'userinfo.email'];
    case 'google_calendar':
      return ['calendar.readonly', 'calendar.events', 'userinfo.profile', 'userinfo.email'];
    case 'microsoft':
    case 'outlook':
      return ['Mail.Read', 'Mail.Send', 'User.Read'];
    case 'onedrive':
      return ['Files.Read', 'Files.ReadWrite', 'User.Read'];
    case 'dropbox':
      return ['files.content.read', 'files.content.write', 'account_info.read'];
    default:
      return [];
  }
}

export default router;
