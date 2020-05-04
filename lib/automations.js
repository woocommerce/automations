/**
 * External dependencies
 */
const { readdirSync } = require("fs");

/** @typedef {import('./typedefs').AutomationTask} AutomationTask */

const allDirs = readdirSync("automations", { withFileTypes: true })
  .filter((file) => file.isDirectory())
  .map((file) => file.name);

/**
 * @type AutomationTask[]
 */
const automations = allDirs.map((moduleName) => {
  return ({ name, events, actions, runner } = require(`./${moduleName}`));
});

module.exports = automations;
