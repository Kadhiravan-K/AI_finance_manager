const CRYPTO_KEY_NAME = 'finance-tracker-crypto-key';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes

let cryptoKey: CryptoKey | null = null;

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(b64: string): ArrayBuffer {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function getEncryptionKey(): Promise<CryptoKey> {
    if (cryptoKey) {
        return cryptoKey;
    }

    const storedKey = localStorage.getItem(CRYPTO_KEY_NAME);
    if (storedKey) {
        try {
            const rawKey = base64ToBuffer(storedKey);
            cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                rawKey,
                { name: ALGORITHM },
                true,
                ['encrypt', 'decrypt']
            );
            return cryptoKey;
        } catch (error) {
            console.error("Failed to import stored key, generating a new one.", error);
            // Fall through to generate a new key if import fails
        }
    }

    // Generate a new key if none is stored or if it's invalid
    const newKey = await window.crypto.subtle.generateKey(
        { name: ALGORITHM, length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Export and store the new key
    const exportedKey = await window.crypto.subtle.exportKey('raw', newKey);
    localStorage.setItem(CRYPTO_KEY_NAME, bufferToBase64(exportedKey));
    cryptoKey = newKey;
    return newKey;
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

    return bufferToBase64(combined.buffer);
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