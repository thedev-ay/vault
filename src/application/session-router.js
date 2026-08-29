const service = require("./vault-service");

const dispatch = (secret, action, payload = {}) => {
  switch (action) {
  case "list":
    return service.listAccounts(secret);
  case "credentials":
    return service.getCredentials(secret, payload.account, { reveal: Boolean(payload.reveal) });
  case "add":
    return service.addCredential(secret, payload);
  case "update":
    return service.updateCredential(secret, payload.id, payload.changes || {});
  case "remove":
    return service.removeCredential(secret, payload.id);
  case "export":
    return service.exportEncrypted(secret).toString("base64");
  case "password":
    service.changePassword(secret, payload.newSecret);
    return { changed: true };
  default:
    throw new Error("Unsupported vault operation.");
  }
};

module.exports = { dispatch };
