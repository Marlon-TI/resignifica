/* Criptografia local — PBKDF2 (SHA-256) + AES-GCM 256 via WebCrypto.
   A chave é derivada da senha e existe só em memória enquanto a sessão está aberta. */
'use strict';
(function (RS) {
  const ITER = 310000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const b64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

  const randomSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));

  async function deriveKey(password, saltB64, iterations = ITER) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: unb64(saltB64), iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  async function encryptJSON(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }

  async function decryptJSON(key, box) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
    return JSON.parse(dec.decode(pt));
  }

  const supported = () => !!(window.crypto && crypto.subtle && window.indexedDB);

  RS.crypto = { ITER, randomSalt, deriveKey, encryptJSON, decryptJSON, supported };
})(window.RS);
