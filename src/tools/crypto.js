const crypto = require("crypto");

const MAGIC_V2 = Buffer.from("VLT2");
const MAGIC_V3 = Buffer.from("VLT3");
const CURRENT_MAGIC = MAGIC_V3;
const ALGORITHM = "aes-256-gcm";
const LEGACY_ALGORITHM = "aes-256-ctr";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEADER_LENGTH = CURRENT_MAGIC.length + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
const VLT2_SCRYPT_OPTIONS = Object.freeze({
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
});
// VLT3 depends on these exact parameters. Use a new format version before
// changing them so existing vaults remain decryptable.
const VLT3_SCRYPT_OPTIONS = Object.freeze({
  N: 32768,
  r: 8,
  p: 3,
  maxmem: 64 * 1024 * 1024
});

const deriveKey = (secret, salt, options) => crypto.scryptSync(
  String(secret),
  salt,
  KEY_LENGTH,
  options
);

const encryptWithKey = (buffer, key, salt) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  cipher.setAAD(CURRENT_MAGIC);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([CURRENT_MAGIC, salt, iv, cipher.getAuthTag(), ciphertext]);
};

const startsWith = (encrypted, magic) => Buffer.from(encrypted)
  .subarray(0, magic.length)
  .equals(magic);

const isLegacy = (encrypted) => !startsWith(encrypted, MAGIC_V2) && !startsWith(encrypted, MAGIC_V3);
const needsUpgrade = (encrypted) => !startsWith(encrypted, CURRENT_MAGIC);

const encrypt = (buffer, secret) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const secretKey = deriveKey(secret, salt, VLT3_SCRYPT_OPTIONS);
  return encryptWithKey(buffer, secretKey, salt);
};

const decryptVersionedWithKey = (encrypted, magic, key) => {
  if (encrypted.length < HEADER_LENGTH) throw new Error("Invalid encrypted vault.");
  let offset = magic.length + SALT_LENGTH;
  const iv = encrypted.subarray(offset, offset += IV_LENGTH);
  const authTag = encrypted.subarray(offset, offset += AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAAD(magic);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted.subarray(offset)), decipher.final()]);
};

const decryptVersioned = (encrypted, secret, magic, scryptOptions) => {
  if (encrypted.length < HEADER_LENGTH) throw new Error("Invalid encrypted vault.");

  const salt = encrypted.subarray(magic.length, magic.length + SALT_LENGTH);
  const secretKey = deriveKey(secret, salt, scryptOptions);
  return decryptVersionedWithKey(encrypted, magic, secretKey);
};

const createSessionContext = (encrypted, secret) => {
  const encryptedBuffer = Buffer.from(encrypted);
  if (!startsWith(encryptedBuffer, MAGIC_V3) || encryptedBuffer.length < HEADER_LENGTH) {
    throw new Error("The vault must be migrated before starting a session.");
  }
  const salt = encryptedBuffer.subarray(MAGIC_V3.length, MAGIC_V3.length + SALT_LENGTH);
  return {
    version: "VLT3",
    salt: salt.toString("base64"),
    key: deriveKey(secret, salt, VLT3_SCRYPT_OPTIONS).toString("base64")
  };
};

const validateSessionContext = (context) => {
  if (!context || context.version !== "VLT3") throw new Error("Invalid vault session.");
  const salt = Buffer.from(context.salt || "", "base64");
  const key = Buffer.from(context.key || "", "base64");
  if (salt.length !== SALT_LENGTH || key.length !== KEY_LENGTH) throw new Error("Invalid vault session.");
  return { salt, key };
};

const decryptWithSessionContext = (encrypted, context) => {
  const encryptedBuffer = Buffer.from(encrypted);
  const { salt, key } = validateSessionContext(context);
  if (!startsWith(encryptedBuffer, MAGIC_V3) ||
      !encryptedBuffer.subarray(MAGIC_V3.length, MAGIC_V3.length + SALT_LENGTH).equals(salt)) {
    throw new Error("The vault changed outside the active session. Lock and unlock it again.");
  }
  return decryptVersionedWithKey(encryptedBuffer, MAGIC_V3, key);
};

const encryptWithSessionContext = (buffer, context) => {
  const { salt, key } = validateSessionContext(context);
  return encryptWithKey(buffer, key, salt);
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
  if (startsWith(encryptedBuffer, MAGIC_V3)) {
    return decryptVersioned(encryptedBuffer, secret, MAGIC_V3, VLT3_SCRYPT_OPTIONS);
  }
  if (startsWith(encryptedBuffer, MAGIC_V2)) {
    return decryptVersioned(encryptedBuffer, secret, MAGIC_V2, VLT2_SCRYPT_OPTIONS);
  }
  return decryptLegacy(encryptedBuffer, secret);
};

module.exports = {
  decrypt,
  encrypt,
  createSessionContext,
  decryptWithSessionContext,
  encryptWithSessionContext,
  isLegacy,
  needsUpgrade
};
