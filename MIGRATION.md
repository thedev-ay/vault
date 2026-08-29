# Vault storage and schema migration

This release preserves VLT3 encryption compatibility while moving encrypted
data from Configstore JSON to a dedicated private file and introducing stable
credential IDs. Legacy AES-256-CTR and VLT2 encryption are also upgraded to
VLT3.

Older application versions cannot understand the new decrypted schema. Keep a
pre-upgrade export until the new version has been fully verified.

## 1. Create durable backups

Before deploying the new version, use the currently installed application:

```bash
vault export
```

Move the printed `.vlt.enc` file out of `/tmp`, outside the repository, and into
durable secure storage. Also copy the production Configstore file:

```bash
cp "$HOME/.config/configstore/vault-prod.json" /secure/location/vault-prod.before-schema-v1.json
```

Use the corresponding path beneath `XDG_CONFIG_HOME` if it was configured when
the vault was created.

## 2. Verify the export in isolation

```bash
npm run build
npm install --global --prefix "$PWD/.acceptance" .
mkdir -p .acceptance-data/config .acceptance-data/tmp
export XDG_CONFIG_HOME="$PWD/.acceptance-data/config"
export TMPDIR="$PWD/.acceptance-data/tmp"
export TMP="$PWD/.acceptance-data/tmp"

.acceptance/bin/vault init --file /secure/location/vault_backup.vlt.enc
.acceptance/bin/vault unlock
.acceptance/bin/vault list --json
.acceptance/bin/vault show known-account
.acceptance/bin/vault lock

unset XDG_CONFIG_HOME TMPDIR TMP
```

Import authenticates the backup before committing it. The isolated unlock then
migrates its decrypted schema and encryption version when necessary.

## 3. Deploy and migrate production

```bash
vault lock
npm run deploy:prod
vault unlock
vault list
vault show known-account
vault export
vault lock
```

Lock before deployment so an agent started by the previous session protocol is
not left running until its normal expiry.

The first successful unlock performs one locked, atomic transaction:

1. Authenticate and decrypt the existing data.
2. Validate every account and credential field.
3. Assign an immutable UUID and timestamps to each legacy credential.
4. Re-encrypt as VLT3 when required.
5. Write the dedicated `vault-prod.vlt` file atomically.
6. Preserve the prior Configstore ciphertext as `vault-prod.vlt.legacy.bak`.

If authentication or validation fails, no migration write occurs. Normal later
writes preserve the immediately previous encrypted file as
`vault-prod.vlt.backup`.

## Rollback

Do not copy decrypted JSON or manually edit Configstore. To roll back:

1. Reinstall the previous application version.
2. Import the pre-upgrade `.vlt.enc` export with `vault init --file`.
3. Unlock it with its original password and verify known credentials.

The `.legacy.bak` and `.backup` files are emergency encrypted copies, but an
explicitly tested export is the preferred recovery source.
