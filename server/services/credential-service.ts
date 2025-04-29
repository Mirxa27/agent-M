import { storage } from "../storage";
import { encrypt, decrypt } from "../../shared/crypto";
import { Credential, InsertCredential } from "@shared/schema";

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
  async createCredential(
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
  async updateCredential(
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

      return updatedCredential;
    } catch (error) {
      console.error("Error updating credential:", error);
      throw new Error(`Failed to update credential: ${error.message}`);
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

      return updatedCredential;
    } catch (error) {
      console.error("Error refreshing credential:", error);
      throw new Error(`Failed to refresh credential: ${error.message}`);
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
      throw new Error(`Failed to list credentials: ${error.message}`);
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
      throw new Error(`Failed to get expiring credentials: ${error.message}`);
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
      throw new Error(`Failed to delete credential: ${error.message}`);
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
  // Implementation depends on the OAuth service and external libraries
  // This is a placeholder that would be implemented based on specific services
  throw new Error("OAuth flow not implemented for this service");
}

export async function completeOAuthFlow(
  userId: number,
  serviceType: string,
  code: string,
  state: string
): Promise<Credential> {
  // Implementation depends on the OAuth service and external libraries
  // This is a placeholder that would be implemented based on specific services
  throw new Error("OAuth flow not implemented for this service");
}