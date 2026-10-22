/**
 * vault/crypto.js — Browser-based cryptography for Muski's Secret Vault
 *
 * Uses SubtleCrypto (Web Crypto API):
 * - PBKDF2 for key derivation from password
 * - AES-GCM 256-bit for symmetric message encryption/decryption
 */

const PBKDF2_ITERATIONS = 100_000;

function bufferToBase64(buf) {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin);
}

function base64ToBuffer(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function generateSalt() {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return bufferToBase64(salt);
}

export async function deriveKey(password, saltB64) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBuf = base64ToBuffer(saltB64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(key, plaintext) {
  const enc = new TextEncoder();
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

export async function decrypt(key, ciphertextB64, ivB64) {
  const ctBuf = base64ToBuffer(ciphertextB64);
  const ivBuf = base64ToBuffer(ivB64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
    key,
    ctBuf
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

export async function generateRsaKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKeyJwk(publicKey) {
  return window.crypto.subtle.exportKey('jwk', publicKey);
}

export async function importPublicKeyJwk(jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

export async function rsaEncrypt(publicKey, plaintext) {
  const enc = new TextEncoder();
  const buf = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    enc.encode(plaintext)
  );
  return bufferToBase64(buf);
}

export async function rsaDecrypt(privateKey, ciphertext) {
  const ctBuf = base64ToBuffer(ciphertext);
  const buf = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ctBuf
  );
  const dec = new TextDecoder();
  return dec.decode(buf);
}

export async function encryptPrivateKey(pk, aesKey, iv) {
  const jwk = await window.crypto.subtle.exportKey('jwk', pk);
  const str = JSON.stringify(jwk);
  const res = await encrypt(aesKey, str);
  return res.ciphertext;
}

export async function decryptPrivateKey(ct, aesKey, iv) {
  const str = await decrypt(aesKey, ct, iv);
  const jwk = JSON.parse(str);
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}
