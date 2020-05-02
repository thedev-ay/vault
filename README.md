# VAULT

A secure credentials manager.

It's free. It's offline. It's encrypted.

## Installation

```bash
npm run deploy:prod
```

## Usage
-  [init](#create-the-vault) - Creates vault
-  [add](#add-credentials) - Adds credentials
-  [list](#list-of-accounts) - Lists accounts available
-  [show](#get-credentials) - Gets credentials
-  [export](#export-the-vault) - Downloads all credentials to an encrypted file
-  [remove](#remove-credentials-on-a-specific-account) - Removes credentials from account
-  [update](#update-credentials) - Updates credentials

### Create the vault

Allows creation of vault from scratch or from a vault backup

#### Show options
```bash
$ vault init --help

Options:
  -f, --file <vlt.enc file>  The vlt.enc file generated after exporting vault
```

#### Create vault from scratch
```bash
$ vault init

Vault initialized!
```

#### Import vault backup

_See [export](#export-the-vault) to create vault backup_
```bash
# vault init -f <vault file>
$ vault init -f /tmp/Vault/vault_1234456788.vlt.enc

Vault initialized!
```

### Add credentials

```bash
# vault add <account>
$ vault add facebook

Enter vault password [A-a, 0-9, symbols]: ******
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

Link to file: /tmp/Vault/vault_1588410242.vlt.enc
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

Enter vault password [A-a, 0-9, symbols]: ******
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

Enter vault password [A-a, 0-9, symbols]: ******
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