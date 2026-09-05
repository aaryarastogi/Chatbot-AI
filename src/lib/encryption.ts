import crypto from 'crypto';

const PREFIX = 'enc_v1:';

function getEncryptionKey(): Buffer {
  const secret =
    process.env.CHAT_ENCRYPTION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'chatbot-ai-encryption-fallback-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a text string using AES-256-GCM.
 * Prepend `enc_v1:` prefix to distinguish encrypted payload from plain text.
 */
export function encryptText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Already encrypted
  if (text.startsWith(PREFIX)) {
    return text;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const ivHex = iv.toString('hex');

    return `${PREFIX}${ivHex}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting text:', error);
    return text;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string (`enc_v1:iv:authTag:ciphertext`).
 * Returns original text if string is not encrypted (backward compatibility).
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  // Legacy unencrypted text
  if (!encryptedText.startsWith(PREFIX)) {
    return encryptedText;
  }

  try {
    const rawPayload = encryptedText.slice(PREFIX.length);
    const parts = rawPayload.split(':');

    if (parts.length !== 3) {
      return encryptedText;
    }

    const [ivHex, authTagHex, cipherHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting text:', error);
    return encryptedText;
  }
}
