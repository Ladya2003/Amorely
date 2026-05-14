import axios from 'axios';
import { API_URL } from '../config';
import { clearCryptoStore, getStoredValue, removeStoredValue, setStoredValue } from './indexedDb';

const WORDS = [
  'amber', 'apple', 'arrow', 'artist', 'autumn', 'balance', 'beacon', 'berry', 'blade', 'bloom',
  'bridge', 'breeze', 'candle', 'canvas', 'canyon', 'cedar', 'charm', 'clover', 'comet', 'coral',
  'crystal', 'daisy', 'dawn', 'delta', 'dream', 'echo', 'ember', 'falcon', 'feather', 'forest',
  'frost', 'galaxy', 'garden', 'glimmer', 'harbor', 'hazel', 'honey', 'horizon', 'island', 'jasmine',
  'jungle', 'lantern', 'lavender', 'legend', 'lilac', 'lotus', 'lumen', 'marble', 'meadow', 'melody',
  'meteor', 'mist', 'moon', 'morning', 'nectar', 'nova', 'oasis', 'ocean', 'olive', 'opal',
  'orchid', 'origin', 'pearl', 'petal', 'phoenix', 'pine', 'pixel', 'planet', 'plume', 'pulse',
  'quartz', 'quest', 'rain', 'ripple', 'river', 'rose', 'saffron', 'satin', 'shadow', 'silver',
  'sketch', 'snow', 'solstice', 'spark', 'spruce', 'star', 'stone', 'sunset', 'thunder', 'tide',
  'timber', 'topaz', 'trail', 'velvet', 'violet', 'wave', 'whisper', 'willow', 'winter', 'zenith'
];

const ACTIVE_DEVICE_KEY = 'crypto:active-device';
const SESSION_CACHE_PREFIX = 'crypto:session:';

export interface LocalDeviceKeys {
  userId: string;
  deviceId: string;
  identityPrivateJwk: JsonWebKey;
  identityPublicJwk: JsonWebKey;
  identityPublicKeyBase64: string;
  createdAt: string;
}

interface EncryptedBackup {
  deviceId: string;
  ciphertext: string;
  iv: string;
  salt: string;
  kdf: {
    name: string;
    iterations: number;
    hash: string;
  };
  version: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const randomString = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window.btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const exportSpkiToBase64 = async (publicKey: CryptoKey): Promise<string> => {
  const spki = await crypto.subtle.exportKey('spki', publicKey);
  return bytesToBase64(new Uint8Array(spki));
};

const importSpkiFromBase64 = async (spkiBase64: string): Promise<CryptoKey> => {
  const bytes = base64ToBytes(spkiBase64);
  return crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
};

const derivePassphraseKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 250000
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const generateRecoveryPhrase = (wordCount = 12): string =>
  Array.from({ length: wordCount }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');

const storageKey = (userId: string) => `${ACTIVE_DEVICE_KEY}:${userId}`;

export const loadLocalKeys = async (userId: string): Promise<LocalDeviceKeys | null> =>
  getStoredValue<LocalDeviceKeys>(storageKey(userId));

export const hasLocalKeys = async (userId: string): Promise<boolean> => Boolean(await loadLocalKeys(userId));

export const removeLocalKeys = async (userId: string): Promise<void> => {
  await removeStoredValue(storageKey(userId));
};

export const wipeAllLocalCrypto = async (): Promise<void> => {
  await clearCryptoStore();
};

const persistLocalKeys = async (keys: LocalDeviceKeys): Promise<void> => {
  await setStoredValue(storageKey(keys.userId), keys);
};

const publishDevice = async (keys: LocalDeviceKeys): Promise<void> => {
  // На текущем этапе сервер не верифицирует подпись signedPreKey, поэтому
  // используем детерминированный placeholder и не пытаемся подписывать ECDH-ключом.
  const signaturePlaceholder = bytesToBase64(
    encoder.encode(`${keys.deviceId}:${keys.identityPublicKeyBase64}`)
  );

  await axios.post(`${API_URL}/api/crypto/devices`, {
    deviceId: keys.deviceId,
    identityPublicKey: keys.identityPublicKeyBase64,
    signedPreKey: {
      keyId: 'spk-1',
      publicKey: keys.identityPublicKeyBase64,
      signature: signaturePlaceholder
    },
    oneTimePreKeys: []
  });
};

export const initializeCryptoForUser = async (userId: string): Promise<LocalDeviceKeys> => {
  const existing = await loadLocalKeys(userId);
  if (existing) {
    return existing;
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const identityPrivateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const identityPublicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const identityPublicKeyBase64 = await exportSpkiToBase64(keyPair.publicKey);

  const keys: LocalDeviceKeys = {
    userId,
    deviceId: `device-${randomString()}`,
    identityPrivateJwk,
    identityPublicJwk,
    identityPublicKeyBase64,
    createdAt: new Date().toISOString()
  };

  await persistLocalKeys(keys);
  await publishDevice(keys);
  return keys;
};

export const saveEncryptedBackup = async (keys: LocalDeviceKeys, passphrase: string): Promise<void> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePassphraseKey(passphrase, salt);
  const plaintext = encoder.encode(JSON.stringify(keys));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const payload: EncryptedBackup = {
    deviceId: keys.deviceId,
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    kdf: {
      name: 'PBKDF2',
      iterations: 250000,
      hash: 'SHA-256'
    },
    version: 1
  };

  await axios.put(`${API_URL}/api/crypto/backup`, payload);
};

export const restoreFromBackup = async (userId: string, passphrase: string): Promise<LocalDeviceKeys> => {
  const response = await axios.get(`${API_URL}/api/crypto/backup`);
  const backup = response.data as EncryptedBackup;
  const salt = base64ToBytes(backup.salt);
  const iv = base64ToBytes(backup.iv);
  const key = await derivePassphraseKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBytes(backup.ciphertext).buffer
  );

  const parsed = JSON.parse(decoder.decode(new Uint8Array(decrypted))) as LocalDeviceKeys;
  if (parsed.userId !== userId) {
    throw new Error('Backup принадлежит другому пользователю');
  }

  await persistLocalKeys(parsed);
  await publishDevice(parsed);
  return parsed;
};

export const exportLocalKeysFileContent = async (userId: string): Promise<string | null> => {
  const keys = await loadLocalKeys(userId);
  if (!keys) return null;
  return JSON.stringify(keys, null, 2);
};

export const importLocalKeysFileContent = async (userId: string, fileContent: string): Promise<LocalDeviceKeys> => {
  const parsed = JSON.parse(fileContent) as LocalDeviceKeys;
  if (parsed.userId !== userId) {
    throw new Error('Файл ключей принадлежит другому пользователю');
  }
  await persistLocalKeys(parsed);
  await publishDevice(parsed);
  return parsed;
};

const buildAesKeyFromSharedSecret = async (sharedSecret: ArrayBuffer, usage: KeyUsage[]): Promise<CryptoKey> => {
  return crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, usage);
};

interface PairingStartResponse {
  pairingId: string;
  shortCode: string;
  expiresAt: string;
}

export interface PairingRequestPayload {
  pairingId: string;
  shortCode: string;
  requesterEphemeralPublicKey: string;
  expiresAt: string;
}

export const createPairingRequest = async (
  requesterDeviceId: string
): Promise<{ payload: PairingRequestPayload; privateJwk: JsonWebKey }> => {
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const privateJwk = await crypto.subtle.exportKey('jwk', eph.privateKey);
  const publicBase64 = await exportSpkiToBase64(eph.publicKey);
  const response = await axios.post(`${API_URL}/api/crypto/pairing/start`, {
    requesterDeviceId,
    requesterEphemeralPublicKey: publicBase64
  });
  const data = response.data as PairingStartResponse;
  return {
    payload: {
      pairingId: data.pairingId,
      shortCode: data.shortCode,
      requesterEphemeralPublicKey: publicBase64,
      expiresAt: data.expiresAt
    },
    privateJwk
  };
};

export const approvePairingRequest = async (
  request: PairingRequestPayload,
  approverKeys: LocalDeviceKeys
): Promise<void> => {
  const requesterPublic = await importSpkiFromBase64(request.requesterEphemeralPublicKey);
  const approverPrivate = await crypto.subtle.importKey(
    'jwk',
    approverKeys.identityPrivateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
  const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: requesterPublic }, approverPrivate, 256);
  const aesKey = await buildAesKeyFromSharedSecret(sharedSecret, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(JSON.stringify(approverKeys))
  );

  const encryptedPayload = JSON.stringify({
    approverIdentityPublicKey: approverKeys.identityPublicKeyBase64,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  });

  await axios.post(`${API_URL}/api/crypto/pairing/${request.pairingId}/approve`, {
    shortCode: request.shortCode,
    encryptedPayload
  });
};

export const consumePairingRequest = async (
  userId: string,
  request: PairingRequestPayload,
  requesterPrivateJwk: JsonWebKey
): Promise<LocalDeviceKeys> => {
  const sessionResponse = await axios.post(`${API_URL}/api/crypto/pairing/${request.pairingId}/consume`);
  const encryptedPayload = JSON.parse(String(sessionResponse.data.encryptedPayload)) as {
    approverIdentityPublicKey: string;
    iv: string;
    ciphertext: string;
  };

  const requesterPrivate = await crypto.subtle.importKey(
    'jwk',
    requesterPrivateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
  const approverPublicKey = await importSpkiFromBase64(encryptedPayload.approverIdentityPublicKey);
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: approverPublicKey },
    requesterPrivate,
    256
  );
  const aesKey = await buildAesKeyFromSharedSecret(sharedSecret, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encryptedPayload.iv) },
    aesKey,
    base64ToBytes(encryptedPayload.ciphertext).buffer
  );
  const keys = JSON.parse(decoder.decode(new Uint8Array(decrypted))) as LocalDeviceKeys;
  if (keys.userId !== userId) {
    throw new Error('Pairing вернул ключи другого пользователя');
  }
  await persistLocalKeys(keys);
  await publishDevice(keys);
  return keys;
};

const getOrCreatePeerPublicKey = async (peerUserId: string): Promise<string> => {
  const cacheKey = `${SESSION_CACHE_PREFIX}peer-public:${peerUserId}`;
  const cached = await getStoredValue<string>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${API_URL}/api/crypto/prekey-bundle/${peerUserId}`);
  const publicKey = String(response.data.identityPublicKey);
  await setStoredValue(cacheKey, publicKey);
  return publicKey;
};

export const encryptChatText = async (
  senderKeys: LocalDeviceKeys,
  receiverUserId: string,
  plaintext: string
): Promise<{ ciphertext: string; iv: string; version: number; algorithm: string; senderDeviceId: string }> => {
  const receiverPublicKeyBase64 = await getOrCreatePeerPublicKey(receiverUserId);
  const receiverPublicKey = await importSpkiFromBase64(receiverPublicKeyBase64);
  const senderPrivateKey = await crypto.subtle.importKey(
    'jwk',
    senderKeys.identityPrivateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverPublicKey },
    senderPrivateKey,
    256
  );
  const aesKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoder.encode(plaintext));
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
    version: 1,
    algorithm: 'ECDH-P256-AES-GCM',
    senderDeviceId: senderKeys.deviceId
  };
};

export const decryptChatText = async (
  receiverKeys: LocalDeviceKeys,
  senderUserId: string,
  encryptedPayload: { ciphertext: string; iv: string }
): Promise<string> => {
  const senderPublicKeyBase64 = await getOrCreatePeerPublicKey(senderUserId);
  const senderPublicKey = await importSpkiFromBase64(senderPublicKeyBase64);
  const receiverPrivateKey = await crypto.subtle.importKey(
    'jwk',
    receiverKeys.identityPrivateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: senderPublicKey },
    receiverPrivateKey,
    256
  );
  const aesKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encryptedPayload.iv) },
    aesKey,
    base64ToBytes(encryptedPayload.ciphertext).buffer
  );
  return decoder.decode(new Uint8Array(decrypted));
};
