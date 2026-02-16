"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto = require("crypto");
class EncryptionService {
    constructor(encryptionKey) {
        this.algorithm = 'aes-256-gcm';
        this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
    }
    encrypt(text) {
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
    decrypt(encrypted, iv, authTag) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    encryptCredentials(credentials) {
        const encrypted = this.encrypt(JSON.stringify(credentials));
        return JSON.stringify(encrypted);
    }
    decryptCredentials(encryptedData) {
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);
        const decrypted = this.decrypt(encrypted, iv, authTag);
        return JSON.parse(decrypted);
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryption.js.map