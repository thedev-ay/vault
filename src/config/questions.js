const validateInput = (input) => input.trim() !== "" || "Cannot be empty.";

const validateSecret = (input) => input !== "" || "Cannot be empty.";

const validateSecretConfirmation = (secretName) => (input, answers) => {
  const validSecret = validateSecret(input);
  if (validSecret !== true) return validSecret;
  return input === answers[secretName] || "Passwords do not match.";
};

const trimInput = (input) => {
  return input.trim();
};

module.exports = {
  init: [
    {
      type: "password",
      name: "secret",
      mask: true,
      message: "Enter vault password:",
      validate: validateSecret
    },
    {
      type: "password",
      name: "secretConfirmation",
      mask: true,
      message: "Confirm vault password:",
      validate: validateSecretConfirmation("secret")
    }
  ],
  changePassword: [
    {
      type: "password",
      name: "newSecret",
      mask: true,
      message: "Enter new vault password:",
      validate: validateSecret
    },
    {
      type: "password",
      name: "newSecretConfirmation",
      mask: true,
      message: "Confirm new vault password:",
      validate: validateSecretConfirmation("newSecret")
    }
  ],
  unlockConfirm: [
    {
      type: "confirm",
      name: "proceed",
      "default": true,
      message: "Vault is locked. Unlock now?"
    }
  ],
  initConfirm: [
    {
      type: "confirm",
      name: "proceed",
      "default": false,
      message: "Vault exists! Are you sure you want to proceed?"
    }
  ],
  add: [
    {
      type: "password",
      name: "secret",
      mask: true,
      message: "Enter vault password:",
      validate: validateSecret
    },
    {
      name: "userid",
      message: "Enter user ID/email:",
      validate: validateInput,
      filter: trimInput
    },
    {
      type: "password",
      name: "password",
      mask: true,
      message: "Enter password:",
      validate: validateSecret
    },
    {
      name: "notes",
      message: "Notes:",
      filter: trimInput
    }
  ],
  update: [
    {
      type: "password",
      name: "secret",
      mask: true,
      message: "Enter vault password:",
      validate: validateSecret
    },
    {
      name: "userid",
      message: "Enter user ID/email:",
      validate: validateInput,
      filter: trimInput
    },
    {
      type: "confirm",
      name: "updatePassword",
      "default": false,
      message: "Update password?"
    },
    {
      type: "password",
      name: "password",
      mask: true,
      message: "Enter password:",
      validate: validateSecret,
      when: (response) => response.updatePassword,
    },
    {
      type: "confirm",
      name: "updateNotes",
      "default": false,
      message: "Update notes?"
    },
    {
      name: "notes",
      message: "Notes:",
      filter: trimInput,      
      when: (response) => response.updateNotes,
    }
  ],
  remove: [
    {
      type: "password",
      name: "secret",
      mask: true,
      message: "Enter vault password:",
      validate: validateSecret
    },
    {
      name: "userid",
      message: "Enter user ID/email:",
      validate: validateInput,
      filter: trimInput
    },
  ],
  default: [
    {
      type: "password",
      name: "secret",
      mask: true,
      message: "Enter vault password:",
      validate: validateSecret
    }
  ]
};
