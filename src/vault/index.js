const init = require("./init/prompt").initPrompt;
const add = require("./add/prompt").addPrompt;
const show = require("./show/prompt").showPrompt;
const list = require("./list/prompt").listPrompt;
const remove = require("./remove/prompt").removePrompt;
const update = require("./update/prompt").updatePrompt;
const exportVault = require("./download/prompt").exportPrompt;

module.exports = {
  init,
  add,
  show,
  list,
  remove,
  update,
  export: exportVault,
};