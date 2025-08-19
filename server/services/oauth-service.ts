import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PublicClientApplication } from '@azure/msal-node';
import { Dropbox } from 'dropbox';
import crypto from 'crypto';
import config from '../config';
import { CredentialService } from './credential-service';

// OAuth state storage (in production, use Redis or database)
const oauthStates = new Map<string, { userId: number; service: string; timestamp: number }>();

// Clean up expired states (older than 10 minutes)
setInterval(
  () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, data] of oauthStates.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        oauthStates.delete(state);
      }
    }
  },
  5 * 60 * 1000
); // Run every 5 minutes

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthFlow {
  authUrl: string;
  state: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
}

/**
 * Google OAuth Service
 */
class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.oauth.credentials.google.clientId,
      config.oauth.credentials.google.clientSecret,
      config.oauth.redirectUris.google
    );
  }

  generateAuthUrl(scopes: string[], state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      tokenType: credentials.token_type,
      scope: credentials.scope,
    };
  }
}

/**
 * Microsoft OAuth Service
 */
class MicrosoftOAuthService {
  private clientApp: PublicClientApplication;

  constructor() {
    if (!config.oauth.credentials.microsoft.clientId) {
      throw new Error('Microsoft OAuth not configured');
    }

    this.clientApp = new PublicClientApplication({
      auth: {
        clientId: config.oauth.credentials.microsoft.clientId!,
        authority: 'https://login.microsoftonline.com/common',
      },
    });
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const authCodeUrlParameters = {
      scopes: scopes,
      redirectUri: config.oauth.redirectUris.microsoft,
      state: state,
      responseMode: 'query' as const,
      prompt: 'consent',
    };

    // Note: MSAL Node doesn't have a direct method for this in server scenarios
    // This is a simplified implementation
    const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
    const params = new URLSearchParams({
      client_id: config.oauth.credentials.microsoft.clientId!,
      response_type: 'code',
      redirect_uri: config.oauth.redirectUris.microsoft,
      scope: scopes.join(' '),
      state: state,
      response_mode: 'query',
      prompt: 'consent',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    // For server-side, we need to make a direct HTTP request to Microsoft
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    const params = new URLSearchParams({
      client_id: config.oauth.credentials.microsoft.clientId!,
      client_secret: config.oauth.credentials.microsoft.clientSecret!,
      code: code,
      redirect_uri: config.oauth.redirectUris.microsoft,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Microsoft OAuth error: ${response.statusText}`);
    }

    const tokens = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      tokenType: tokens.token_type,
      scope: tokens.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    const params = new URLSearchParams({
      client_id: config.oauth.credentials.microsoft.clientId!,
      client_secret: config.oauth.credentials.microsoft.clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Microsoft token refresh error: ${response.statusText}`);
    }

    const tokens = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      tokenType: tokens.token_type,
      scope: tokens.scope,
    };
  }
}

/**
 * Dropbox OAuth Service
 */
class DropboxOAuthService {
  private dbx: Dropbox;

  constructor() {
    if (
      !config.oauth.credentials.dropbox.clientId ||
      !config.oauth.credentials.dropbox.clientSecret
    ) {
      throw new Error('Dropbox OAuth not configured');
    }

    this.dbx = new Dropbox({
      clientId: config.oauth.credentials.dropbox.clientId!,
      clientSecret: config.oauth.credentials.dropbox.clientSecret!,
    });
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const authUrl = this.dbx.getAuthenticationUrl(
      config.oauth.redirectUris.dropbox,
      state,
      'code',
      'offline'
    );
    return authUrl;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await this.dbx.getAccessTokenFromCode(config.oauth.redirectUris.dropbox, code);

    return {
      accessToken: response.result.access_token,
      refreshToken: response.result.refresh_token,
      expiresAt: response.result.expires_in
        ? new Date(Date.now() + response.result.expires_in * 1000)
        : undefined,
      tokenType: response.result.token_type,
      scope: response.result.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await this.dbx.refreshAccessToken(refreshToken);

    return {
      accessToken: response.result.access_token,
      refreshToken: response.result.refresh_token || refreshToken,
      expiresAt: response.result.expires_in
        ? new Date(Date.now() + response.result.expires_in * 1000)
        : undefined,
      tokenType: response.result.token_type,
      scope: response.result.scope,
    };
  }
}

/**
 * Main OAuth Service
 */
export class OAuthService {
  private googleService: GoogleOAuthService;
  private microsoftService: MicrosoftOAuthService | null = null;
  private dropboxService: DropboxOAuthService | null = null;
  private credentialService: CredentialService;

  constructor() {
    this.googleService = new GoogleOAuthService();
    this.credentialService = new CredentialService();

    // Initialize services if configured
    try {
      this.microsoftService = new MicrosoftOAuthService();
    } catch (error) {
      console.warn('Microsoft OAuth not configured:', error.message);
    }

    try {
      this.dropboxService = new DropboxOAuthService();
    } catch (error) {
      console.warn('Dropbox OAuth not configured:', error.message);
    }
  }

  /**
   * Begin OAuth flow for a service
   */
  async beginOAuthFlow(userId: number, service: string, scopes?: string[]): Promise<OAuthFlow> {
    const state = crypto.randomBytes(32).toString('hex');

    // Store state for verification
    oauthStates.set(state, {
      userId,
      service,
      timestamp: Date.now(),
    });

    let authUrl: string;
    let defaultScopes: string[];

    switch (service.toLowerCase()) {
      case 'google':
      case 'gmail':
      case 'google_drive':
      case 'google_calendar':
        defaultScopes = this.getDefaultScopes(service);
        authUrl = this.googleService.generateAuthUrl(scopes || defaultScopes, state);
        break;

      case 'microsoft':
      case 'outlook':
      case 'onedrive':
        if (!this.microsoftService) {
          throw new Error('Microsoft OAuth not configured');
        }
        defaultScopes = this.getDefaultScopes(service);
        authUrl = this.microsoftService.generateAuthUrl(scopes || defaultScopes, state);
        break;

      case 'dropbox':
        if (!this.dropboxService) {
          throw new Error('Dropbox OAuth not configured');
        }
        defaultScopes = this.getDefaultScopes(service);
        authUrl = this.dropboxService.generateAuthUrl(scopes || defaultScopes, state);
        break;

      default:
        throw new Error(`Unsupported OAuth service: ${service}`);
    }

    return { authUrl, state };
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async completeOAuthFlow(
    code: string,
    state: string
  ): Promise<{ userId: number; credential: any }> {
    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired OAuth state');
    }

    oauthStates.delete(state);

    const { userId, service } = stateData;
    let tokens: OAuthTokens;

    switch (service.toLowerCase()) {
      case 'google':
      case 'gmail':
      case 'google_drive':
      case 'google_calendar':
        tokens = await this.googleService.exchangeCodeForTokens(code);
        break;

      case 'microsoft':
      case 'outlook':
      case 'onedrive':
        if (!this.microsoftService) {
          throw new Error('Microsoft OAuth not configured');
        }
        tokens = await this.microsoftService.exchangeCodeForTokens(code);
        break;

      case 'dropbox':
        if (!this.dropboxService) {
          throw new Error('Dropbox OAuth not configured');
        }
        tokens = await this.dropboxService.exchangeCodeForTokens(code);
        break;

      default:
        throw new Error(`Unsupported OAuth service: ${service}`);
    }

    // Save credential
    const credential = await this.credentialService.createCredentialWithOptions(
      userId,
      `${service} OAuth`,
      service,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
      },
      {
        authMethod: 'oauth',
        expiresInDays: 90,
      }
    );

    return { userId, credential };
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshOAuthTokens(credential: any): Promise<OAuthTokens> {
    const credentialData = JSON.parse(credential.data);

    if (!credentialData.refreshToken) {
      throw new Error('No refresh token available');
    }

    let tokens: OAuthTokens;

    switch (credential.type.toLowerCase()) {
      case 'google':
      case 'gmail':
      case 'google_drive':
      case 'google_calendar':
        tokens = await this.googleService.refreshTokens(credentialData.refreshToken);
        break;

      case 'microsoft':
      case 'outlook':
      case 'onedrive':
        if (!this.microsoftService) {
          throw new Error('Microsoft OAuth not configured');
        }
        tokens = await this.microsoftService.refreshTokens(credentialData.refreshToken);
        break;

      case 'dropbox':
        if (!this.dropboxService) {
          throw new Error('Dropbox OAuth not configured');
        }
        tokens = await this.dropboxService.refreshTokens(credentialData.refreshToken);
        break;

      default:
        throw new Error(`Unsupported OAuth service: ${credential.type}`);
    }

    // Update stored credential
    const updatedData = {
      ...credentialData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || credentialData.refreshToken,
      expiresAt: tokens.expiresAt,
      updatedAt: new Date(),
    };

    await this.credentialService.updateCredential(credential.id, updatedData);

    return tokens;
  }

  /**
   * Get default scopes for a service
   */
  private getDefaultScopes(service: string): string[] {
    switch (service.toLowerCase()) {
      case 'google':
      case 'gmail':
        return [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ];

      case 'google_drive':
        return [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ];

      case 'google_calendar':
        return [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ];

      case 'microsoft':
      case 'outlook':
        return [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/User.Read',
        ];

      case 'onedrive':
        return [
          'https://graph.microsoft.com/Files.Read',
          'https://graph.microsoft.com/Files.ReadWrite',
          'https://graph.microsoft.com/User.Read',
        ];

      case 'dropbox':
        return ['files.content.read', 'files.content.write', 'account_info.read'];

      default:
        return [];
    }
  }

  /**
   * Check if a service supports OAuth
   */
  isOAuthSupported(service: string): boolean {
    const supportedServices = [
      'google',
      'gmail',
      'google_drive',
      'google_calendar',
      'microsoft',
      'outlook',
      'onedrive',
      'dropbox',
    ];
    return supportedServices.includes(service.toLowerCase());
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
