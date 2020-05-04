const moduleNames = ["todos"];

/**
 * @type AutomationTask[]
 */
const automations = allDirs.map((moduleName) => {
  return ({ name, events, actions, runner } = require(`./${moduleName}`));
});

module.exports = automations;
