# VLT3 Encryption Migration

This guide transitions a live vault from the legacy AES-256-CTR or earlier VLT2
format to the versioned `VLT3` format, which uses stronger scrypt password
derivation and AES-256-GCM authenticated encryption.

Keep the pre-migration backup indefinitely. Older versions of VAULT cannot read
the new `VLT3` format.

## 1. Back up the live vault

Complete this step before deploying the new version.

Using the currently installed live version, create an encrypted export:

```bash
vault export
```

The command prints a path similar to:

```text
/tmp/Vault/vault_1234567890.vlt.enc
```

Copy that file to a permanent, secure location outside `/tmp` and outside the
Git repository. Files in `/tmp` may be removed automatically by the operating
system.

Also copy the raw production configuration as a second backup. Its default
location is:

```bash
cp "$HOME/.config/configstore/vault-prod.json" /your/safe/location/vault-prod.before-v2.json
```

If `XDG_CONFIG_HOME` was configured when the live vault was created, the raw
configuration will be under that directory instead.

## 2. Test the backup in acceptance

Build and install an isolated acceptance version if this has not already been
done:

```bash
npm run build
npm install --global --prefix "$PWD/.acceptance" .
```

Create isolated configuration and temporary directories:

```bash
mkdir -p .acceptance-data/config .acceptance-data/tmp

export XDG_CONFIG_HOME="$PWD/.acceptance-data/config"
export TMPDIR="$PWD/.acceptance-data/tmp"
export TMP="$PWD/.acceptance-data/tmp"
```

Import and verify a copy of the legacy backup:

```bash
.acceptance/bin/vault init -f /your/safe/location/vault_1234567890.vlt.enc
.acceptance/bin/vault unlock
.acceptance/bin/vault list
.acceptance/bin/vault show <known-account>
.acceptance/bin/vault lock
```

The successful acceptance unlock migrates only the isolated acceptance copy.
Confirm that the expected accounts and credentials are present.

Clear the acceptance environment before using the production CLI:

```bash
unset XDG_CONFIG_HOME TMPDIR TMP
```

Opening a new terminal also clears these variables. Do not continue to production
with the acceptance variables still set, or `vault` will use the acceptance
configuration instead of the live configuration.

## 3. Deploy to production

Deploy globally only after the acceptance verification succeeds:

```bash
npm run deploy:prod
```

Unlock the live vault:

```bash
vault unlock
```

The first successful unlock:

1. Decrypts the existing AES-256-CTR vault.
2. Parses and validates the vault structure and credential field types.
3. Re-encrypts the data in the scrypt and AES-256-GCM `VLT3` format.
4. Starts the normal timed unlock session.

If the password is incorrect or the older vault cannot be parsed and validated,
the migration does not rewrite the stored vault.

Verify known data after migration:

```bash
vault list
vault show <known-account>
```

Be aware that `show` prints decrypted credentials to the terminal.

## 4. Create a VLT3 backup

After verifying the migrated live vault, create a new encrypted export:

```bash
vault export
vault lock
```

Copy the new export from `/tmp/Vault` to a permanent, secure location. Retain
both this new-format backup and the pre-migration legacy backup.

## Rollback

The old application cannot read a migrated `VLT3` vault. To roll back:

1. Reinstall the previous application version.
2. Restore the pre-migration `.vlt.enc` export using `vault init -f`.
3. Unlock it with the original vault password and verify known credentials.

Do not attempt to restore `vault-prod.before-v2.json` by manually editing the
live configuration. Preserve it as an emergency copy and prefer restoration
through the encrypted `.vlt.enc` export.
