import CryptoJS from 'crypto-js';

// Secret key for encryption/decryption
// In a production environment, this should be stored securely
// and potentially retrieved from environment variables
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'mirxa-encryption-secret-key';

/**
 * Encrypts a string using AES encryption
 * @param data - Plain text data to encrypt
 * @returns Encrypted string
 */
export function encrypt(data: string): string {
  const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return encrypted;
}

/**
 * Decrypts an encrypted string
 * @param encryptedData - Encrypted data to decrypt
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY).toString(CryptoJS.enc.Utf8);
  return decrypted;
}

/**
 * Generate a secure hash of a password
 * @param password - Password to hash
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Verify if a password matches a hash
 * @param password - Plain text password to check
 * @param hash - Hash to compare against
 * @returns Boolean indicating if password matches hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = CryptoJS.SHA256(password).toString();
  return passwordHash === hash;
}
