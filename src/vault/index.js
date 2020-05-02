const promptInit = require("./init/prompt");
const promptAdd = require("./add/prompt");
const promptShow = require("./show/prompt");
const promptList = require("./list/prompt");
const promptRemove = require("./remove/prompt");
const promptUpdate = require("./update/prompt");
const promptExport = require("./download/prompt");

module.exports = {
  init: promptInit,
  add: promptAdd,
  show: promptShow,
  list: promptList,
  remove: promptRemove,
  update: promptUpdate,
  export: promptExport,
};