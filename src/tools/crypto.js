const crypto = require("crypto");
const algorithm = "aes-256-ctr";

const encrypt = (buffer, secret) => {
  const secretkey = crypto.createHash("sha256").update(String(secret)).digest("base64").substr(0, 32);

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, secretkey, iv);

  const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
  return result;
};

const decrypt = (encrypted, secret) => {
  const secretkey = crypto.createHash("sha256").update(String(secret)).digest("base64").substr(0, 32);

  const iv = encrypted.slice(0, 16);

  encrypted = encrypted.slice(16);

  const decipher = crypto.createDecipheriv(algorithm, secretkey, iv);

  const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return result;
};

module.exports = {
  decrypt,
  encrypt
};