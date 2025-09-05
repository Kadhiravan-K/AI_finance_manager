const CRYPTO_KEY_NAME = 'finance-tracker-crypto-key';
const CRYPTO_KEY_BACKUP_NAME = 'finance-tracker-crypto-key-backup';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes

let cryptoKey: CryptoKey | null = null;
let keyPromise: Promise<CryptoKey> | null = null;

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
    // Switched to a more robust implementation that avoids "Maximum call stack size exceeded" with large data.
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(b64: string): ArrayBuffer {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer as ArrayBuffer;
}

async function importAndSetKey(keyB64: string): Promise<CryptoKey> {
    const rawKey = base64ToBuffer(keyB64);
    const importedKey = await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: ALGORITHM },
        true,
        ['encrypt', 'decrypt']
    );
    cryptoKey = importedKey;
    return cryptoKey;
}

async function initializeEncryptionKey(): Promise<CryptoKey> {
    const mainKeyB64 = localStorage.getItem(CRYPTO_KEY_NAME);
    const backupKeyB64 = localStorage.getItem(CRYPTO_KEY_BACKUP_NAME);

    // 1. Try importing the main key
    if (mainKeyB64) {
        try {
            return await importAndSetKey(mainKeyB64);
        } catch (error) {
            console.warn("Failed to import main encryption key. Attempting to restore from backup.", error);
        }
    }

    // 2. Main key failed or doesn't exist, try the backup
    if (backupKeyB64) {
        try {
            const importedKey = await importAndSetKey(backupKeyB64);
            console.log("Successfully restored encryption key from backup. Resyncing main key.");
            // If backup works, restore it to the main key slot
            localStorage.setItem(CRYPTO_KEY_NAME, backupKeyB64);
            return importedKey;
        } catch (error) {
            console.error("Failed to import backup encryption key as well. A new key must be generated, which may result in data loss.", error);
        }
    }

    // 3. Both keys failed or don't exist, generate a new one
    console.log("Generating a new encryption key. Existing data may become unreadable if it was encrypted with a different key.");
    const newKey = await window.crypto.subtle.generateKey(
        { name: ALGORITHM, length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Export and store the new key in both slots
    const exportedKey = await window.crypto.subtle.exportKey('raw', newKey);
    const newKeyB64 = bufferToBase64(exportedKey);
    localStorage.setItem(CRYPTO_KEY_NAME, newKeyB64);
    localStorage.setItem(CRYPTO_KEY_BACKUP_NAME, newKeyB64);
    
    cryptoKey = newKey;
    return newKey;
}


function getEncryptionKey(): Promise<CryptoKey> {
    if (cryptoKey) {
        return Promise.resolve(cryptoKey);
    }
    if (!keyPromise) {
        keyPromise = initializeEncryptionKey();
    }
    return keyPromise;
}

export async function encrypt(data: unknown): Promise<string> {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const dataString = JSON.stringify(data);
    const encodedData = new TextEncoder().encode(dataString);

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return bufferToBase64(combined.buffer as ArrayBuffer);
}

export async function decrypt(encryptedData: string): Promise<unknown> {
    const key = await getEncryptionKey();
    const combinedBuffer = base64ToBuffer(encryptedData);

    const iv = combinedBuffer.slice(0, IV_LENGTH);
    const data = combinedBuffer.slice(IV_LENGTH);

    const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv: new Uint8Array(iv) },
        key,
        data
    );

    const decodedString = new TextDecoder().decode(decryptedContent);
    return JSON.parse(decodedString);
}
