// packages/shared/src/utils/encryption.ts
import * as crypto from 'crypto';

export class EncryptionService {
    private algorithm = 'aes-256-gcm';
    private key: Buffer;

    constructor(encryptionKey: string) {
        // Derive a 32-byte key from the provided string
        this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
    }

    encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag
        };
    }

    decrypt(encrypted: string, iv: string, authTag: string): string {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // For encrypting cloud credentials
    encryptCredentials(credentials: any): string {
        const encrypted = this.encrypt(JSON.stringify(credentials));
        return JSON.stringify(encrypted);
    }

    decryptCredentials(encryptedData: string): any {
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);
        const decrypted = this.decrypt(encrypted, iv, authTag);
        return JSON.parse(decrypted);
    }
}