const todos = require( './automations/todos' );

const moduleNames = [ todos ];

/**
 * @typedef {import('./typedefs').AutomationTask} AutomationTask
 */

/**
 * @type {AutomationTask[]}
 */
const automations = moduleNames.map( ( module ) => module );

module.exports = automations;
