const crypto = require("crypto");

const MAGIC = Buffer.from("VLT2");
const ALGORITHM = "aes-256-gcm";
const LEGACY_ALGORITHM = "aes-256-ctr";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
const SCRYPT_OPTIONS = {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
};

const deriveKey = (secret, salt) => crypto.scryptSync(
  String(secret),
  salt,
  KEY_LENGTH,
  SCRYPT_OPTIONS
);

const isLegacy = (encrypted) => !Buffer.from(encrypted).subarray(0, MAGIC.length).equals(MAGIC);

const encrypt = (buffer, secret) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const secretKey = deriveKey(secret, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  cipher.setAAD(MAGIC);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([MAGIC, salt, iv, authTag, ciphertext]);
};

const decryptCurrent = (encrypted, secret) => {
  if (encrypted.length < HEADER_LENGTH) throw new Error("Invalid encrypted vault.");

  let offset = MAGIC.length;
  const salt = encrypted.subarray(offset, offset += SALT_LENGTH);
  const iv = encrypted.subarray(offset, offset += IV_LENGTH);
  const authTag = encrypted.subarray(offset, offset += AUTH_TAG_LENGTH);
  const ciphertext = encrypted.subarray(offset);
  const secretKey = deriveKey(secret, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  decipher.setAAD(MAGIC);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

const decryptLegacy = (encrypted, secret) => {
  const secretKey = crypto.createHash("sha256")
    .update(String(secret))
    .digest("base64")
    .substr(0, 32);
  const iv = encrypted.subarray(0, 16);
  const ciphertext = encrypted.subarray(16);
  const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, secretKey, iv);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

const decrypt = (encrypted, secret) => {
  const encryptedBuffer = Buffer.from(encrypted);
  return isLegacy(encryptedBuffer)
    ? decryptLegacy(encryptedBuffer, secret)
    : decryptCurrent(encryptedBuffer, secret);
};

module.exports = {
  decrypt,
  encrypt,
  isLegacy
};
