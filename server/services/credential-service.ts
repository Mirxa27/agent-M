import { storage } from "../storage";
import { encrypt, decrypt } from "../../shared/crypto";
import { Credential, InsertCredential, insertCredentialSchema } from "@shared/schema";
import { google } from 'googleapis'; // Import googleapis
import { OAuth2Client } from 'google-auth-library'; // Import OAuth2Client
import nodemailer from "nodemailer"; // Import nodemailer
import config from '../config'; // Import config

// List of supported service types with their specific properties
export const SERVICE_TYPES = {
  GMAIL: "gmail",
  GOOGLE_CALENDAR: "google_calendar",
  GOOGLE_DRIVE: "google_drive",
  MICROSOFT_OUTLOOK: "outlook",
  MICROSOFT_ONEDRIVE: "onedrive",
  DROPBOX: "dropbox",
  SLACK: "slack",
  ZOOM: "zoom",
  GITHUB: "github",
  JIRA: "jira",
  TRELLO: "trello",
  ASANA: "asana",
  CUSTOM: "custom",
};

// Auth methods
export const AUTH_METHODS = {
  API_KEY: "api_key",
  OAUTH: "oauth",
  DIRECT_LOGIN: "direct_login",
  APP_PASSWORD: "app_password", // For services like Gmail that offer app passwords
};

interface CredentialOptions {
  expiresInDays?: number;
  authMethod?: string;
}

export class CredentialService {
  /**
   * Creates or updates a credential with secure encryption and expiration settings
   */
  async createCredentialWithOptions(
    userId: number,
    name: string,
    type: string,
    data: any,
    options: CredentialOptions = {}
  ): Promise<Credential> {
    try {
      // Set default expiration to 90 days if not specified
      const expiresInDays = options.expiresInDays ?? 90;
      const authMethod = options.authMethod ?? AUTH_METHODS.API_KEY;

      // Calculate expiration date
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Encrypt credential data
      const encryptedData = encrypt(JSON.stringify(data));

      // Create credential record
      const credential = await storage.createCredential({
        userId,
        name,
        type,
        data: encryptedData,
        authMethod,
        expiresAt,
        lastRefreshedAt: new Date(),
      });

      return credential;
    } catch (error) {
      console.error("Error creating credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create credential: ${errorMessage}`);
    }
  }

  /**
   * Gets a credential with decrypted data
   */
  async getCredential(
    id: number,
    userId: number
  ): Promise<{ credential: Credential; data: any } | null> {
    try {
      const credential = await storage.getCredential(id);

      if (!credential || credential.userId !== userId) {
        return null;
      }

      // Check if credential is expired
      if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
        throw new Error("Credential has expired");
      }

      // Decrypt the data
      const decryptedString = decrypt(credential.data);
      if (!decryptedString) {
        throw new Error("Failed to decrypt credential data");
      }

      const decryptedData = JSON.parse(decryptedString);

      return {
        credential,
        data: decryptedData,
      };
    } catch (error) {
      console.error("Error getting credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get credential: ${errorMessage}`);
    }
  }

  /**
   * Updates a credential with new data and/or settings
   */
  async updateCredentialWithOptions(
    id: number,
    userId: number,
    updates: {
      name?: string;
      type?: string;
      data?: any;
      authMethod?: string;
      expiresInDays?: number;
    }
  ): Promise<Credential | null> {
    try {
      // First, get the existing credential to check ownership
      const credential = await storage.getCredential(id);

      if (!credential || credential.userId !== userId) {
        return null;
      }

      // Prepare update object
      const credentialUpdates: any = {};

      if (updates.name) credentialUpdates.name = updates.name;
      if (updates.type) credentialUpdates.type = updates.type;
      if (updates.authMethod) credentialUpdates.authMethod = updates.authMethod;

      // Update expiration if specified
      if (updates.expiresInDays !== undefined) {
        if (updates.expiresInDays > 0) {
          credentialUpdates.expiresAt = new Date(
            Date.now() + updates.expiresInDays * 24 * 60 * 60 * 1000
          );
        } else {
          credentialUpdates.expiresAt = null; // No expiration
        }
      }

      // Update data if provided
      if (updates.data) {
        credentialUpdates.data = encrypt(JSON.stringify(updates.data));
        credentialUpdates.lastRefreshedAt = new Date();
      }

      // Update the credential
      const updatedCredential = await storage.updateCredential(
        id,
        credentialUpdates
      );

      return updatedCredential || null;
    } catch (error) {
      console.error("Error updating credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update credential: ${errorMessage}`);
    }
  }

  /**
   * Refreshes a credential's expiration date
   */
  async refreshCredential(
    id: number,
    userId: number,
    expiresInDays: number = 90
  ): Promise<Credential | null> {
    try {
      const credential = await storage.getCredential(id);

      if (!credential || credential.userId !== userId) {
        return null;
      }

      // Calculate new expiration date
      const expiresAt = new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      );

      // Update the credential
      const updatedCredential = await storage.updateCredential(id, {
        expiresAt,
        lastRefreshedAt: new Date(),
      });

      return updatedCredential || null;
    } catch (error) {
      console.error("Error refreshing credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to refresh credential: ${errorMessage}`);
    }
  }

  /**
   * Lists all credentials for a user, optionally filtered by type
   */
  async listCredentials(
    userId: number,
    type?: string
  ): Promise<Omit<Credential, "data">[]> {
    try {
      let credentials = await storage.getCredentialsByUserId(userId);

      // Filter by type if specified
      if (type) {
        credentials = credentials.filter((cred) => cred.type === type);
      }

      // Don't include sensitive data in the response
      return credentials.map(({ data, ...rest }) => rest);
    } catch (error) {
      console.error("Error listing credentials:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list credentials: ${errorMessage}`);
    }
  }

  /**
   * Checks if a credential is about to expire
   */
  async getExpiringCredentials(
    userId: number,
    daysThreshold: number = 7
  ): Promise<Omit<Credential, "data">[]> {
    try {
      const credentials = await storage.getCredentialsByUserId(userId);
      const now = new Date();
      const thresholdDate = new Date(
        now.getTime() + daysThreshold * 24 * 60 * 60 * 1000
      );

      const expiringCredentials = credentials.filter((cred) => {
        if (!cred.expiresAt) return false;
        const expiresAt = new Date(cred.expiresAt);
        return expiresAt <= thresholdDate && expiresAt > now;
      });

      // Don't include sensitive data in the response
      return expiringCredentials.map(({ data, ...rest }) => rest);
    } catch (error) {
      console.error("Error getting expiring credentials:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get expiring credentials: ${errorMessage}`);
    }
  }

  /**
   * Deletes a credential
   */
  async deleteCredential(id: number, userId: number): Promise<boolean> {
    try {
      const credential = await storage.getCredential(id);

      if (!credential || credential.userId !== userId) {
        return false;
      }

      return await storage.deleteCredential(id);
    } catch (error) {
      console.error("Error deleting credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete credential: ${errorMessage}`);
    }
  }

  /**
   * Get a credential by service name or type
   */
  async getCredentialByService(
    userId: number,
    serviceName: string
  ): Promise<Credential | null> {
    try {
      const credentials = await storage.getCredentialsByUserId(userId);

      // Find credentials for this service
      const credential = credentials.find(
        (cred) => cred.type === serviceName ||
                  (cred.service !== null && cred.service === serviceName)
      );

      return credential || null;
    } catch (error) {
      console.error("Error getting credential by service:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get credential by service: ${errorMessage}`);
    }
  }

  /**
   * Create a new credential from a simple object
   */
  async createCredential(data: {
    userId: number;
    name: string;
    type: string;
    data: any;
    authMethod?: string;
    expiresAt?: Date | null;
    lastRefreshedAt?: Date | null;
    service?: string;
  }): Promise<Credential> {
    try {
      // Encrypt data if it's not already encrypted
      let encryptedData = typeof data.data === 'string' ?
        data.data : encrypt(JSON.stringify(data.data));

      // Create credential record
      const credential = await storage.createCredential({
        userId: data.userId,
        name: data.name,
        type: data.type,
        data: encryptedData,
        authMethod: data.authMethod || AUTH_METHODS.API_KEY,
        expiresAt: data.expiresAt || null,
        lastRefreshedAt: data.lastRefreshedAt || new Date(),
        service: data.service
      });

      return credential;
    } catch (error) {
      console.error("Error creating credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create credential: ${errorMessage}`);
    }
  }

  /**
   * Update a credential by ID
   */
  async updateCredential(id: number, updates: Partial<Credential>): Promise<Credential | null> {
    try {
      // If data is being updated and it's not a string, encrypt it
      if (updates.data && typeof updates.data !== 'string') {
        updates.data = encrypt(JSON.stringify(updates.data));
      }

      // Update the credential
      const updatedCredential = await storage.updateCredential(id, updates);
      return updatedCredential || null;
    } catch (error) {
      console.error("Error updating credential:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update credential: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const credentialService = new CredentialService();

// Export OAuth-specific functions
export async function beginOAuthFlow(
  userId: number,
  serviceType: string
): Promise<{ authUrl: string; state: string }> {
  try {
    // Generate a unique state parameter to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // Implementation depends on the OAuth service and external libraries
    switch (serviceType.toLowerCase()) {
      case SERVICE_TYPES.GMAIL:
      case SERVICE_TYPES.GOOGLE_CALENDAR:
      case SERVICE_TYPES.GOOGLE_DRIVE: {
        const { OAuth2Client } = await import('google-auth-library');
        const config = (await import('../config')).default; // Dynamically import config

        if (!config.oauth.credentials.google.clientId || !config.oauth.credentials.google.clientSecret) {
          throw new Error("Google OAuth credentials not configured.");
        }

        const oauth2Client = new OAuth2Client(
          config.oauth.credentials.google.clientId,
          config.oauth.credentials.google.clientSecret,
          config.oauth.redirectUris.google
        );

        // Define the scopes required for the service
        let scopes: string[] = [];
        if (serviceType === SERVICE_TYPES.GMAIL) {
          scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
        } else if (serviceType === SERVICE_TYPES.GOOGLE_CALENDAR) {
          scopes = ['https://www.googleapis.com/auth/calendar.events.readonly'];
        } else if (serviceType === SERVICE_TYPES.GOOGLE_DRIVE) {
          scopes = ['https://www.googleapis.com/auth/drive.readonly'];
        }


        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline', // Request a refresh token
          scope: scopes,
          state: `${userId}:${serviceType}:${state}`, // Include userId and serviceType in state
          prompt: 'consent', // Ensure refresh token is returned
        });

        return { authUrl, state };
      }
      // Add cases for other services (Microsoft, Dropbox, etc.)
      default:
        throw new Error(`OAuth flow not implemented for service: ${serviceType}`);
    }
  } catch (error) {
    console.error(`Error beginning OAuth flow for ${serviceType}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to begin OAuth flow: ${errorMessage}`);
  }
}

export async function completeOAuthFlow(
  userId: number,
  serviceType: string,
  code: string,
  state: string
): Promise<Credential> {
  try {
    // Validate the state parameter
    const [stateUserId, stateServiceType, stateRandom] = state.split(':');
    if (parseInt(stateUserId) !== userId || stateServiceType !== serviceType) {
      throw new Error("Invalid state parameter.");
    }

    // Implementation depends on the OAuth service and external libraries
    switch (serviceType.toLowerCase()) {
      case SERVICE_TYPES.GMAIL:
      case SERVICE_TYPES.GOOGLE_CALENDAR:
      case SERVICE_TYPES.GOOGLE_DRIVE: {
        const { OAuth2Client } = await import('google-auth-library');
        const config = (await import('../config')).default; // Dynamically import config

        if (!config.oauth.credentials.google.clientId || !config.oauth.credentials.google.clientSecret) {
          throw new Error("Google OAuth credentials not configured.");
        }

        const oauth2Client = new OAuth2Client(
          config.oauth.credentials.google.clientId,
          config.oauth.credentials.google.clientSecret,
          config.oauth.redirectUris.google
        );

        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
          throw new Error("Failed to get access token.");
        }

        // Get user email (optional, but useful for credential name)
        let userEmail = '';
        if (tokens.id_token) {
          try {
            const { payload } = await oauth2Client.verifyIdToken({
              idToken: tokens.id_token,
              audience: config.oauth.credentials.google.clientId,
            });
            userEmail = payload?.email || '';
          } catch (verifyError) {
            console.warn("Failed to verify ID token:", verifyError);
          }
        }


        // Create a new credential record
        const credentialData: GmailCredentials = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token, // Store refresh token for offline access
          expires_at: tokens.expiry_date,
          email: userEmail,
          scope: tokens.scope?.split(' '),
        };

        const credential = await credentialService.createCredential(
          userId,
          `${serviceType} (${userEmail || 'OAuth'})`, // Default name
          serviceType,
          credentialData,
          { authMethod: AUTH_METHODS.OAUTH }
        );

        return credential;
      }
      // Add cases for other services (Microsoft, Dropbox, etc.)
      default:
        throw new Error(`OAuth flow not implemented for service: ${serviceType}`);
    }
  } catch (error) {
    console.error(`Error completing OAuth flow for ${serviceType}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to complete OAuth flow: ${errorMessage}`);
  }
}
