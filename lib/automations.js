const todos = require("./automations/todos");

const moduleNames = [todos];

/**
 * @type AutomationTask[]
 */
const automations = moduleNames.map((module) => module);

module.exports = automations;
