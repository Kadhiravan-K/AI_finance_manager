import { AppState } from '../types';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes
const SALT_LENGTH = 16; // bytes
const PBKDF2_ITERATIONS = 100000;

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(b64: string): ArrayBuffer {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ALGORITHM, length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function createBackup(state: AppState, password: string): Promise<void> {
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await getKey(password, salt);
    
    const dataString = JSON.stringify(state);
    const encodedData = new TextEncoder().encode(dataString);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encodedData
    );
    
    const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

    const blob = new Blob([combined.buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `personal_finance_hub_backup_${new Date().toISOString().split('T')[0]}.pfh`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function restoreBackup(file: File, password: string): Promise<AppState> {
    const fileBuffer = await file.arrayBuffer();
    
    const salt = fileBuffer.slice(0, SALT_LENGTH);
    const iv = fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = fileBuffer.slice(SALT_LENGTH + IV_LENGTH);

    const key = await getKey(password, new Uint8Array(salt));

    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            key,
            data
        );
        
        const decodedString = new TextDecoder().decode(decryptedContent);
        return JSON.parse(decodedString) as AppState;
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed. Please check your password and file integrity.");
    }
}