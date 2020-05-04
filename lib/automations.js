/**
 * External dependencies
 */
const { readdirSync } = require("fs");
const { path } = require("path");
/** @typedef {import('./typedefs').AutomationTask} AutomationTask */

const allDirs = readdirSync(path.resolve("./automations"), {
  withFileTypes: true,
})
  .filter((file) => file.isDirectory())
  .map((file) => file.name);

/**
 * @type AutomationTask[]
 */
const automations = allDirs.map((moduleName) => {
  return ({ name, events, actions, runner } = require(`./${moduleName}`));
});

module.exports = automations;
