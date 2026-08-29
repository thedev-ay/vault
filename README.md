# VAULT

A secure credentials manager.

It's free. It's offline. It's encrypted.

## Encryption

New and updated vaults use a versioned `VLT3` format with scrypt password
derivation (`N=32768`, `r=8`, `p=3`) and AES-256-GCM authenticated encryption.
These scrypt parameters are fixed for VLT3 compatibility. A fresh random salt
and nonce are generated every time the vault is written, and authentication
detects an incorrect password or modified ciphertext.

Vaults created by older versions remain readable. After the first successful
unlock, a legacy AES-256-CTR or earlier VLT2 vault is automatically rewritten in
the `VLT3` format. Existing backup files are not modified and can still be
imported.

## Development and deployment

### Development

Install the locked dependencies once:

```bash
npm ci
```

Run the automated tests and create a production build:

```bash
npm test
npm run build
```

Run the source CLI directly while developing:

```bash
node src/index.js init
node src/index.js unlock
node src/index.js list
node src/index.js lock
```

Source execution uses the development vault (`vault-dev`), which is separate
from the globally installed production vault.

### Acceptance

Build and install the CLI into a project-local prefix. This does not replace the
globally installed `vault` command:

```bash
npm run build
npm install --global --prefix "$PWD/.acceptance" .
```

Create isolated configuration and temporary directories, then export them in
the terminal used for acceptance testing:

```bash
mkdir -p .acceptance-data/config .acceptance-data/tmp

export XDG_CONFIG_HOME="$PWD/.acceptance-data/config"
export TMPDIR="$PWD/.acceptance-data/tmp"
export TMP="$PWD/.acceptance-data/tmp"
```

Exercise the packaged CLI:

```bash
.acceptance/bin/vault init
.acceptance/bin/vault unlock --minutes 30
.acceptance/bin/vault add github
.acceptance/bin/vault list
.acceptance/bin/vault show github
.acceptance/bin/vault update github
.acceptance/bin/vault export
.acceptance/bin/vault remove github
.acceptance/bin/vault lock
```

Clear the acceptance environment variables when finished. Opening a new terminal
also clears them:

```bash
unset XDG_CONFIG_HOME TMPDIR TMP
```

The acceptance installation and data remain in `.acceptance` and
`.acceptance-data`; both directories can be deleted after testing.

### Production

Deploy globally only after acceptance succeeds:

```bash
npm run deploy:prod
```

This replaces the globally installed `vault` command while retaining its
existing production vault data. Do not run `deploy:prod` during development or
acceptance testing.

## Usage

-  [init](#create-the-vault) - Creates vault
-  [unlock](#temporarily-unlock-the-vault) - Starts a timed unlock session
-  [lock](#lock-the-vault) - Ends the current unlock session
-  [password](#change-the-master-password) - Changes the master vault password
-  [add](#add-credentials) - Adds credentials
-  [list](#list-of-accounts) - Lists accounts available
-  [show](#get-credentials) - Gets credentials
-  [export](#export-the-vault) - Downloads all credentials to an encrypted file
-  [remove](#remove-credentials-on-a-specific-account) - Removes credentials from account
-  [update](#update-credentials) - Updates credentials

### Create the vault

Allows creation of vault from scratch or from a vault backup

First-time initialization is allowed while locked. Replacing an existing vault
requires an active unlock session, which ends after replacement.

#### Show options
```bash
$ vault init --help

Options:
  -f, --file <vlt.enc file>  The vlt.enc file generated after exporting vault
```

#### Create vault from scratch
```bash
$ vault init

Enter vault password: ******
Confirm vault password: ******
Vault initialized!
```

#### Import vault backup

_See [export](#export-the-vault) to create vault backup_
```bash
# vault init -f <vault file>
$ vault init -f /tmp/Vault-a1b2c3/vault_550e8400-e29b-41d4-a716-446655440000.vlt.enc

Vault initialized!
```

The vault must be unlocked before credentials can be read or changed. Run
`vault unlock` to start a temporary session.

### Temporarily unlock the vault

The password is kept only in the session agent's memory and is never written to
disk. The session lasts 5 minutes by default.

```bash
$ vault unlock

Enter vault password: ******
Vault unlocked until 2:45:00 PM.
```

Choose a different duration (up to 30 minutes) with `--minutes`:

```bash
$ vault unlock --minutes 30
```

While the session is active, `add`, `list`, `show`, `export`, `remove`, and
`update` can run without asking for the vault password. When the session is
missing or expired, these commands offer to unlock the vault before continuing:

```text
? Vault is locked. Unlock now? Yes
? Enter vault password: ******
```

Choosing `No` leaves the vault locked and stops the command.

### Lock the vault

End the session immediately:

```bash
$ vault lock

Vault locked!
```

### Change the master password

The vault must be unlocked before changing its master password. If it is locked,
the command offers to unlock it first.

```bash
$ vault password

Enter new vault password: ********
Confirm new vault password: ********
Vault password changed. Vault locked!
```

All vault data is re-encrypted with the new password and the active session is
ended. Existing backup files still require the password that was active when
they were created, so create a new export after changing the password.

### Add credentials

```bash
# vault add <account>
$ vault add facebook

Enter user ID/email: thedev.ay
Enter password: **********
Notes:

Credentials added!
```

### List of accounts 
_Note: This command won't show credentials!_
```bash
$ vault list

  +----------+
  | Account  |
  +----------+
  | facebook |
  | netflix  |
  | twitter  |
  +----------+
```

### Get credentials

#### Get credentials for specific account
```bash
# vault show [account]
$ vault show facebook

  +----------+-----------+--------------------+-------+
  | Account  | UserId    | Password           | Notes |
  +----------+-----------+--------------------+-------+
  | facebook | thedev.ay | <plaintext string> |       |
  +----------+-----------+--------------------+-------+
```

#### Get all credentials
```bash
$ vault show

  +----------+-----------+--------------------+-------+
  | Account  | UserId    | Password           | Notes |
  +----------+-----------+--------------------+-------+
  | facebook | thedev.ay | <plaintext string> |       |
  | netflix  | thedev.ay | <plaintext string> |       |
  | github   | thedev.ay | <plaintext string> |       |
  +----------+-----------+--------------------+-------+

```

### Export the vault
_Creates an encrypted copy of your vault. See [init](#import-vault-backup) to import vault._

```bash
$ vault export

Link to file: /tmp/Vault-a1b2c3/vault_550e8400-e29b-41d4-a716-446655440000.vlt.enc
```

### Remove credentials on a specific account
```bash
# Before delete
$ vault show

  +----------+-----------+--------------------+-------+
  | Account  | UserId    | Password           | Notes |
  +----------+-----------+--------------------+-------+
  | facebook | thedev.ay | <plaintext string> |       |
  | netflix  | thedev.ay | <plaintext string> |       |
  | github   | thedev.ay | <plaintext string> |       |
  +----------+-----------+--------------------+-------+

# vault remove <account>
$ vault remove facebook

Enter user ID/email: thedev.ay

Credentials removed!

# After delete
$ vault show

  +----------+-----------+--------------------+-------+
  | Account  | UserId    | Password           | Notes |
  +----------+-----------+--------------------+-------+
  | netflix  | thedev.ay | <plaintext string> |       |
  | github   | thedev.ay | <plaintext string> |       |
  +----------+-----------+--------------------+-------+
```

### Update credentials
_Updates can only be done for password and notes_
```bash
# vault update <account>
$ vault update github

Enter user ID/email: thedev.ay
Update password? Yes
Enter password: ***********
Update notes? Yes
Notes: Some notes here

Credentials updated!

# vault show <account>
$ vault show github

  +----------+-----------+--------------------+-----------------+
  | Account  | UserId    | Password           | Notes           |
  +----------+-----------+--------------------+-----------------+
  | github   | thedev.ay | <plaintext string> | Some notes here |
  +----------+-----------+--------------------+-----------------+
```

## Contributing
Pull requests are welcome.

## License
[MIT](https://choosealicense.com/licenses/mit/)
