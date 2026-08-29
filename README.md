# VAULT

An offline, authenticated-encryption credentials manager for the terminal.

## Security model

Vault files use the versioned `VLT3` format: scrypt (`N=32768`, `r=8`, `p=3`)
and AES-256-GCM. The file is authenticated, so an incorrect password and a
modified ciphertext are rejected. Legacy AES-256-CTR and VLT2 files remain
importable and are migrated after a successful unlock.

The master password is used in the unlocking process to derive a VLT3 session
key, then discarded. The private session agent receives the derived key—not the
master password—and accepts only bounded vault operations over a user-private
socket. Each rewrite uses a fresh GCM nonce. A new random scrypt salt is created
when a vault is initialized or its master password changes.

The encrypted vault is stored as a private `.vlt` file rather than inside the
preferences JSON. Writes use a process lock, temporary file, `fsync`, and atomic
rename. The previous encrypted file is retained as `.vlt.backup`; a legacy
Configstore value is retained as `.vlt.legacy.bak` when first migrated.

Vault contents use a versioned schema with an immutable ID per credential.
Account names and user IDs can therefore be changed safely.

No password manager can protect an unlocked account from malicious software
running as the same OS user. Terminal output, clipboard managers, backups, and
screen sharing remain part of the user's security boundary.

## Install and develop

```bash
npm ci
npm test
npm run build
```

Run the development vault directly:

```bash
node src/index.js init
node src/index.js unlock
node src/index.js list
node src/index.js lock
```

Source execution uses `vault-dev`; a production build uses `vault-prod`.

For isolated packaged acceptance:

```bash
npm run build
npm install --global --prefix "$PWD/.acceptance" .
mkdir -p .acceptance-data/config .acceptance-data/tmp
export XDG_CONFIG_HOME="$PWD/.acceptance-data/config"
export TMPDIR="$PWD/.acceptance-data/tmp"
export TMP="$PWD/.acceptance-data/tmp"

.acceptance/bin/vault init
.acceptance/bin/vault unlock --minutes 30
.acceptance/bin/vault add github
.acceptance/bin/vault list
.acceptance/bin/vault show github
.acceptance/bin/vault update github
.acceptance/bin/vault export
.acceptance/bin/vault remove github
.acceptance/bin/vault lock

unset XDG_CONFIG_HOME TMPDIR TMP
```

Deploy globally only after acceptance succeeds:

```bash
npm run deploy:prod
```

See [MIGRATION.md](MIGRATION.md) before upgrading an existing production vault.

## Commands

### Initialize or import

```bash
vault init
vault init --file /secure/path/vault_backup.vlt.enc
```

New vaults ask for and confirm a master password. Imports ask for the backup's
password and authenticate its contents before replacing anything. Replacing an
existing vault requires an active unlock session and confirmation; replacement
ends that session.

### Unlock and lock

```bash
vault unlock
vault unlock --minutes 30
vault lock
```

Sessions last five minutes by default and at most 30 minutes. A command can
offer an inline five-minute unlock if no session is active.

### Add and list

```bash
vault add github
vault list
vault list --json
```

`list` prints account names and their credential counts. JSON output contains no
passwords and is emitted without banners or terminal escape sequences.

### Show

```bash
vault show
vault show github
vault show github --reveal
vault show github --json
vault show github --json --reveal
```

Passwords are masked by default. `--reveal` is an explicit disclosure to the
terminal. JSON also omits the password property unless `--reveal` is supplied.

### Copy without printing

```bash
vault copy github
vault copy github --field username
vault copy github --clear-seconds 60
```

`copy` copies the selected password by default. If an account has multiple
credentials, it presents a selector. The detached clearing helper removes the
value only if the clipboard still contains that exact value, so it will not
erase something copied afterward. Supported environments use `pbcopy` on macOS,
`clip.exe` on Windows, `wl-copy` on Wayland, or `xclip` on X11. Clipboard
managers may retain history even after the active clipboard is cleared.

### Update and remove

```bash
vault update github
vault remove github
```

Both commands select a credential by immutable ID behind the scenes. Update can
change account, user ID, password, and notes. Remove requires an explicit
confirmation.

### Export and change password

```bash
vault export
vault password
```

Exports are encrypted and created in a private temporary directory. Move them
to durable secure storage because temporary files can be deleted by the OS.
After a password change, the vault is locked and old exports still require the
password that encrypted them.

## Recovery

The active encrypted file and its backup are beside the Configstore preferences
file, normally under `~/.config/configstore/`. Never edit encrypted files or the
preference JSON manually. Prefer importing a known-good encrypted export. See
[MIGRATION.md](MIGRATION.md) for backup and rollback procedures.

## License

[MIT](https://choosealicense.com/licenses/mit/)
