import { credentialService, SERVICE_TYPES, AUTH_METHODS } from "./credential-service";
import { google } from 'googleapis'; // Import googleapis
import { OAuth2Client } from 'google-auth-library'; // Import OAuth2Client

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
   */
  async getMessages(userId: number, credentialId: number, options: GmailOptions = {}) {
    try {
      // Retrieve Gmail credentials first
      const { credential, data: credentials } = await this.getGmailCredentials(userId, credentialId);

      let auth;
      if (credential.authMethod === AUTH_METHODS.OAUTH && credentials.access_token) {
        // Use OAuth2 client
        const oauth2Client = new OAuth2Client();
        oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token, // Include refresh token if available
          expiry_date: credentials.expires_at,
        });
        auth = oauth2Client;
      } else if (credential.authMethod === AUTH_METHODS.APP_PASSWORD && credentials.email && credentials.app_password) {
        // Use App Password (less common for API access, but included for completeness)
        // Gmail API typically uses OAuth. This path might be more relevant for SMTP.
        // For Gmail API, OAuth is the standard.
        throw new Error("Gmail API does not support App Password authentication for fetching messages.");
      } else {
        throw new Error("Invalid or missing credentials for fetching Gmail messages.");
      }

      const gmail = google.gmail({ version: 'v1', auth });

      const listResponse = await gmail.users.messages.list({
        userId: 'me', // 'me' refers to the authenticated user
        maxResults: options.maxResults || 10,
        labelIds: options.labelIds,
        q: options.query,
      });

      const messages = listResponse.data.messages || [];
      const detailedMessages = await Promise.all(messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!, // message.id is guaranteed to exist here
          format: options.includeAttachments ? 'full' : 'metadata', // Get full content if attachments are needed
        });
        return msg.data;
      }));

      return {
        messages: detailedMessages,
        nextPageToken: listResponse.data.nextPageToken,
        resultSizeEstimate: listResponse.data.resultSizeEstimate,
      };
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch Gmail messages: ${errorMessage}`);
    }
  }

  /**
   * Send email via Gmail using stored credentials
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
      const { credential, data: credentials } = await this.getGmailCredentials(userId, credentialId);

      let auth;
      if (credential.authMethod === AUTH_METHODS.OAUTH && credentials.access_token) {
        const oauth2Client = new OAuth2Client();
        oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          expiry_date: credentials.expires_at,
        });
        auth = oauth2Client;
      } else if (credential.authMethod === AUTH_METHODS.APP_PASSWORD && credentials.email && credentials.app_password) {
        // Use Nodemailer with SMTP for App Password
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: credentials.email,
            pass: credentials.app_password,
          },
        });

        const mailOptions = {
          from: credentials.email,
          to: Array.isArray(to) ? to.join(',') : to,
          subject,
          html: body,
          attachments: attachments.map(att => ({
            filename: att.filename,
            content: att.content, // Assuming content is base64 or buffer
            contentType: att.contentType,
          })),
        };

        const info = await transporter.sendMail(mailOptions);
        return {
          success: true,
          messageId: info.messageId,
        };

      } else {
        throw new Error("Invalid or missing credentials for sending email.");
      }

      const gmail = google.gmail({ version: 'v1', auth });

      // Create the email raw content
      const emailLines = [
        `To: ${Array.isArray(to) ? to.join(',') : to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
      ];

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        // This is a simplified attachment handling. For full MIME support,
        // a library like 'mailcomposer' might be needed.
        throw new Error("Attachment sending not fully implemented for Gmail API (OAuth).");
      }

      const raw = Buffer.from(emailLines.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      const sendResponse = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw,
        },
      });

      return {
        success: true,
        messageId: sendResponse.data.id,
      };

    } catch (error) {
      console.error("Error sending Gmail email:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send email via Gmail: ${errorMessage}`);
    }
  }

  /**
   * Refreshes Gmail OAuth token if it's expired
   */
  async refreshOAuthToken(userId: number, credentialId: number) {
    try {
      // Retrieve Gmail credentials first
      const { credential, data: credentials } = await this.getGmailCredentials(userId, credentialId);

      // Only applicable for OAuth authentication
      if (credential.authMethod !== AUTH_METHODS.OAUTH) {
        throw new Error("Credential doesn't use OAuth authentication");
      }

      // Check if access token is expired or about to expire (e.g., within 5 minutes)
      const now = Date.now();
      const expiryThreshold = 5 * 60 * 1000; // 5 minutes

      if (!credentials.expires_at || credentials.expires_at <= now + expiryThreshold) {
        if (!credentials.refresh_token) {
          throw new Error("Refresh token is missing for expired access token.");
        }

        const oauth2Client = new OAuth2Client();
        oauth2Client.setCredentials({
          refresh_token: credentials.refresh_token,
        });

        // Refresh the access token
        const { credentials: refreshedTokens } = await oauth2Client.refreshAccessToken();

        if (!refreshedTokens.access_token) {
          throw new Error("Failed to refresh access token.");
        }

        // Update the credentials with the new access token and expiry
        await credentialService.updateCredential(credentialId, userId, {
          data: {
            ...credentials,
            access_token: refreshedTokens.access_token,
            expires_at: refreshedTokens.expiry_date,
            // Keep the existing refresh_token if the API doesn't return a new one
            refresh_token: refreshedTokens.refresh_token || credentials.refresh_token,
          }
        });

        console.log(`Gmail access token refreshed for credential ${credentialId}`);
      }

      return true;
    } catch (error) {
      console.error("Error refreshing Gmail OAuth token:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to refresh Gmail OAuth token: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();
