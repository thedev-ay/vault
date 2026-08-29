class VaultError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (cause) this.cause = cause;
  }
}

class VaultNotInitializedError extends VaultError {
  constructor() {
    super("Vault is not initialized. Run `vault init` first.", "VAULT_NOT_INITIALIZED");
  }
}

class AuthenticationError extends VaultError {
  constructor(cause) {
    super("Unable to authenticate the vault. The password is incorrect or the file was modified.", "AUTHENTICATION_FAILED", cause);
  }
}

class CorruptVaultError extends VaultError {
  constructor(cause) {
    super("Vault data is corrupted or uses an unsupported schema.", "VAULT_CORRUPT", cause);
  }
}

class VaultStorageError extends VaultError {
  constructor(message, cause) {
    super(message || "The vault could not be saved.", "VAULT_STORAGE_FAILED", cause);
  }
}

class VaultBusyError extends VaultError {
  constructor() {
    super("The vault is busy. Wait for the other command to finish and try again.", "VAULT_BUSY");
  }
}

class AccountNotFoundError extends VaultError {
  constructor() {
    super("Account not found!", "ACCOUNT_NOT_FOUND");
  }
}

class CredentialNotFoundError extends VaultError {
  constructor() {
    super("Credential not found!", "CREDENTIAL_NOT_FOUND");
  }
}

module.exports = {
  VaultError,
  VaultNotInitializedError,
  AuthenticationError,
  CorruptVaultError,
  VaultStorageError,
  VaultBusyError,
  AccountNotFoundError,
  CredentialNotFoundError
};
