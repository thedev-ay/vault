const validateInput = (input) => {  
  if (!input) {
    console.log("Cannot be empty!!!");
  }
  return input !== "";
};

const trimInput = (input) => {
  return input.trim();
};

module.exports = {
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
      message: "Enter vault password [A-a, 0-9, symbols]:",
      validate: validateInput,
      filter: trimInput
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
      validate: validateInput,
      filter: trimInput
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
      message: "Enter vault password [A-a, 0-9, symbols]:",
      validate: validateInput,
      filter: trimInput
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
      validate: validateInput,
      filter: trimInput,
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
      message: "Enter vault password [A-a, 0-9, symbols]:",
      validate: validateInput,
      filter: trimInput
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
      message: "Enter vault password [A-a, 0-9, symbols]:",
      validate: validateInput,
      filter: trimInput
    }
  ]
};