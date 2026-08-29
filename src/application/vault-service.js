const repository = require("../infrastructure/vault-repository");
const domain = require("../domain/vault");

const publicCredential = (credential, reveal = false) => ({
  id: credential.id,
  account: credential.account,
  userid: credential.userid,
  password: reveal ? credential.password : undefined,
  notes: credential.notes,
  createdAt: credential.createdAt,
  updatedAt: credential.updatedAt
});

const listAccounts = (secret) => {
  const { vault } = repository.read(secret);
  return [...new Set(vault.credentials.map((credential) => credential.account))]
    .sort((left, right) => left.localeCompare(right))
    .map((account) => ({
      account,
      credentials: vault.credentials.filter((credential) => credential.account === account).length
    }));
};

const getCredentials = (secret, account, options = {}) => {
  const { vault } = repository.read(secret);
  const credentials = account ? domain.accountCredentials(vault, account) : vault.credentials;
  return credentials.map((credential) => publicCredential(credential, options.reveal));
};

const addCredential = (secret, input) => repository.update(secret, (vault) =>
  publicCredential(domain.addCredential(vault, input), false));

const updateCredential = (secret, id, changes) => repository.update(secret, (vault) =>
  publicCredential(domain.updateCredential(vault, id, changes), false));

const removeCredential = (secret, id) => repository.update(secret, (vault) =>
  publicCredential(domain.removeCredential(vault, id), false));

const updateByUserId = (secret, account, changes) => {
  return repository.update(secret, (vault) => {
    const credential = domain.accountCredentials(vault, account).find((item) => item.userid === changes.userid);
    if (!credential) throw new Error("User ID not found!");
    return publicCredential(domain.updateCredential(vault, credential.id, changes), false);
  });
};

const removeByUserId = (secret, account, userid) => {
  return repository.update(secret, (vault) => {
    const credential = domain.accountCredentials(vault, account).find((item) => item.userid === userid);
    if (!credential) throw new Error("User ID not found!");
    return publicCredential(domain.removeCredential(vault, credential.id), false);
  });
};

const changePassword = (currentSecret, newSecret) => {
  if (currentSecret === newSecret) throw new Error("New vault password must be different.");
  repository.rekey(currentSecret, newSecret);
};

module.exports = {
  listAccounts,
  getCredentials,
  addCredential,
  updateCredential,
  removeCredential,
  updateByUserId,
  removeByUserId,
  changePassword,
  exportEncrypted: repository.exportEncrypted,
  migrate: repository.migrate
};
