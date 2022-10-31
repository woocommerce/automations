/**
 * @typedef {import('./typedefs').AutomationTask} AutomationTask
 */

/**
 * @type {AutomationTask[]}
 */
module.exports = [
	require( './automations/todos' ),
	require( './automations/release' ),
	require( './automations/assign-milestone' ),
	require( './automations/update-milestone' ),
];
