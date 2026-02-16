export declare class EncryptionService {
    private algorithm;
    private key;
    constructor(encryptionKey: string);
    encrypt(text: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    };
    decrypt(encrypted: string, iv: string, authTag: string): string;
    encryptCredentials(credentials: any): string;
    decryptCredentials(encryptedData: string): any;
}
