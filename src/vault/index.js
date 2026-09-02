const init = require("./init/prompt").initPrompt;
const add = require("./add/prompt").addPrompt;
const show = require("./show/prompt").showPrompt;
const list = require("./list/prompt").listPrompt;
const remove = require("./remove/prompt").removePrompt;
const update = require("./update/prompt").updatePrompt;
const exportVault = require("./download/prompt").exportPrompt;
const unlock = require("./unlock/prompt").unlockPrompt;
const lock = require("./lock/index").lock;
const password = require("./password/prompt").passwordPrompt;
const copy = require("./copy/prompt").copyPrompt;
const systemUpdate = require("./system-update/prompt").systemUpdatePrompt;

module.exports = {
  init,
  add,
  show,
  list,
  remove,
  update,
  unlock,
  lock,
  password,
  copy,
  systemUpdate,
  export: exportVault,
};
