import CryptoJS from 'crypto-js';

// Hash a string using SHA-256
export function hashString(text: string): string {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

// Hash a file using SHA-256 (client-side)
export async function hashFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
                const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
                resolve(hash);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Format hash for display (truncate middle)
export function formatHash(hash: string, startChars: number = 8, endChars: number = 8): string {
    if (hash.length <= startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

// Validate if a string is a valid SHA-256 hash
export function isValidHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
}

// Validate if a string is a valid Kaspa transaction ID
export function isValidTxId(txId: string): boolean {
    return /^[a-f0-9]{64}$/.test(txId);
}

// Validate Kaspa address format
export function isValidKaspaAddress(address: string): boolean {
    return /^kaspa:[a-z0-9]{61,63}$/.test(address);
}
