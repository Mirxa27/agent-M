import CryptoJS from "crypto-js";

/**
 * Gets the encryption key from environment or uses a fallback for development
 * In production, this MUST be set as an environment variable
 */
function getEncryptionKey(): string {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    // For development only - in production, always use an environment variable
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "WARNING: Using default encryption key in production environment",
      );
    }
    return "mirxa-encryption-secret-key-for-development-only";
  }

  return envKey;
}

/**
 * Encrypts a string using AES encryption with a secure key
 * @param data - Plain text data to encrypt
 * @returns Encrypted string
 */
export function encrypt(data: string): string {
  if (!data) return "";

  // Generate a random IV for each encryption
  const iv = CryptoJS.lib.WordArray.random(16);

  // Use the encryption key
  const key = getEncryptionKey();

  // Encrypt the data with the IV
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
  });

  // Combine the IV and encrypted data in the output
  const result = iv.toString() + ":" + encrypted.toString();
  return result;
}

/**
 * Decrypts an encrypted string
 * @param encryptedData - Encrypted data to decrypt
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return "";

  try {
    // Split the IV and encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = parts[0];
    const encrypted = parts[1];

    // Use the encryption key
    const key = getEncryptionKey();

    // Decrypt the data with the IV
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}
