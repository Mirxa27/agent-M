import { credentialService, SERVICE_TYPES, AUTH_METHODS } from "./credential-service";

// Gmail API data structure interface
interface GmailCredentials {
  access_token?: string;
  refresh_token?: string;
  app_password?: string;
  email?: string;
  scope?: string[];
  expires_at?: number;
}

interface GmailOptions {
  maxResults?: number;
  includeAttachments?: boolean;
  labelIds?: string[];
  query?: string;
}

export class GmailService {
  /**
   * Creates or updates Gmail credentials with the appropriate authentication method
   */
  async saveGmailCredentials(
    userId: number,
    name: string,
    data: GmailCredentials,
    expiresInDays: number = 90
  ) {
    try {
      // Determine auth method based on provided credentials
      let authMethod = AUTH_METHODS.DIRECT_LOGIN;
      
      if (data.access_token && data.refresh_token) {
        authMethod = AUTH_METHODS.OAUTH;
      } else if (data.app_password) {
        authMethod = AUTH_METHODS.APP_PASSWORD;
      }

      return await credentialService.createCredential(
        userId,
        name,
        SERVICE_TYPES.GMAIL,
        data,
        {
          authMethod,
          expiresInDays
        }
      );
    } catch (error) {
      console.error("Error saving Gmail credentials:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save Gmail credentials: ${errorMessage}`);
    }
  }

  /**
   * Gets Gmail credentials for a user by credential ID
   */
  async getGmailCredentials(userId: number, credentialId: number) {
    try {
      const result = await credentialService.getCredential(credentialId, userId);
      
      if (!result || result.credential.type !== SERVICE_TYPES.GMAIL) {
        throw new Error("Gmail credentials not found");
      }
      
      return {
        credential: result.credential,
        data: result.data as GmailCredentials
      };
    } catch (error) {
      console.error("Error fetching Gmail credentials:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch Gmail credentials: ${errorMessage}`);
    }
  }

  /**
   * Lists all Gmail credentials for a user
   */
  async listGmailCredentials(userId: number) {
    try {
      return await credentialService.listCredentials(userId, SERVICE_TYPES.GMAIL);
    } catch (error) {
      console.error("Error listing Gmail credentials:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list Gmail credentials: ${errorMessage}`);
    }
  }

  /**
   * Fetches Gmail messages using the stored credentials
   * Note: This would require the actual Gmail API integration
   */
  async getMessages(userId: number, credentialId: number, options: GmailOptions = {}) {
    try {
      // Retrieve Gmail credentials first
      const { data: credentials } = await this.getGmailCredentials(userId, credentialId);
      
      // This would use the appropriate Gmail API library with the credentials
      // to fetch messages based on options
      // This is a placeholder implementation
      
      return {
        messages: [],
        nextPageToken: null,
        resultSizeEstimate: 0
      };
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch Gmail messages: ${errorMessage}`);
    }
  }

  /**
   * Send email via Gmail using stored credentials
   * Note: This would require the actual Gmail API integration
   */
  async sendEmail(
    userId: number, 
    credentialId: number,
    {
      to,
      subject,
      body,
      attachments = []
    }: {
      to: string | string[], 
      subject: string, 
      body: string, 
      attachments?: {filename: string, content: string, contentType: string}[]
    }
  ) {
    try {
      // Retrieve Gmail credentials first
      const { data: credentials } = await this.getGmailCredentials(userId, credentialId);
      
      // This would use the appropriate Gmail API library with the credentials
      // to send an email
      // This is a placeholder implementation
      
      return {
        success: true,
        messageId: `placeholder-message-id-${Date.now()}`
      };
    } catch (error) {
      console.error("Error sending Gmail email:", error);
      throw new Error(`Failed to send email via Gmail: ${error.message}`);
    }
  }

  /**
   * Refreshes Gmail OAuth token if it's expired
   * Note: This would require the actual Gmail API OAuth integration
   */
  async refreshOAuthToken(userId: number, credentialId: number) {
    try {
      // Retrieve Gmail credentials first
      const { credential, data: credentials } = await this.getGmailCredentials(userId, credentialId);
      
      // Only applicable for OAuth authentication
      if (credential.authMethod !== AUTH_METHODS.OAUTH) {
        throw new Error("Credential doesn't use OAuth authentication");
      }
      
      // Check if access token is expired
      if (!credentials.expires_at || credentials.expires_at <= Date.now()) {
        // This would implement the OAuth refresh token flow
        // with the appropriate OAuth library
        // For now, this is a placeholder
        
        // Update the credentials with the new access token
        await credentialService.updateCredential(credentialId, userId, {
          data: {
            ...credentials,
            access_token: "new-access-token",
            expires_at: Date.now() + 3600 * 1000 // Typically 1 hour
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error refreshing Gmail OAuth token:", error);
      throw new Error(`Failed to refresh Gmail OAuth token: ${error.message}`);
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();